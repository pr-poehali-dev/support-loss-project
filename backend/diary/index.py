'''
Business: CRUD API для записей дневника пользователей
Args: event - dict с httpMethod, body, queryStringParameters, headers
      context - object с request_id, function_name
Returns: HTTP response с записями дневника, статистикой или статусом операции
'''

import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL environment variable is not set')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_str:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'X-User-Id header is required'}),
            'isBase64Encoded': False
        }
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid user ID format'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action', 'list')
            
            if action == 'stats':
                cursor.execute('''
                    SELECT 
                        COUNT(*) as entries_total,
                        COALESCE(AVG(mood), 0) as mood_average
                    FROM diary_entries 
                    WHERE user_id = %s AND entry_date >= %s
                ''', (user_id, (datetime.now() - timedelta(days=7)).date()))
                
                stats_row = cursor.fetchone()
                
                cursor.execute('''
                    SELECT entry_date 
                    FROM diary_entries 
                    WHERE user_id = %s 
                    ORDER BY entry_date DESC 
                    LIMIT 30
                ''', (user_id,))
                
                dates = [row['entry_date'] for row in cursor.fetchall()]
                streak = 0
                current_date = datetime.now().date()
                
                for i in range(len(dates)):
                    if dates[i] == current_date - timedelta(days=i):
                        streak += 1
                    else:
                        break
                
                result = {
                    'daysStreak': streak,
                    'entriesTotal': int(stats_row['entries_total']),
                    'moodAverage': round(float(stats_row['mood_average']), 1)
                }
                
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
            
            else:
                limit = int(query_params.get('limit', '20'))
                cursor.execute('''
                    SELECT id, entry_date as date, mood, text, created_at 
                    FROM diary_entries 
                    WHERE user_id = %s 
                    ORDER BY entry_date DESC, created_at DESC 
                    LIMIT %s
                ''', (user_id, limit))
                
                entries = []
                for row in cursor.fetchall():
                    entries.append({
                        'id': row['id'],
                        'date': row['date'].isoformat(),
                        'mood': row['mood'],
                        'text': row['text'],
                        'createdAt': row['created_at'].isoformat()
                    })
                
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'entries': entries}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            mood = body_data.get('mood')
            text = body_data.get('text', '').strip()
            entry_date = body_data.get('date', datetime.now().date().isoformat())
            
            if not text:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Text is required'}),
                    'isBase64Encoded': False
                }
            
            if mood is None or not (1 <= mood <= 10):
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Mood must be between 1 and 10'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                INSERT INTO diary_entries (user_id, entry_date, mood, text) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id, entry_date, mood, text, created_at
            ''', (user_id, entry_date, mood, text))
            
            row = cursor.fetchone()
            conn.commit()
            
            result = {
                'id': row['id'],
                'date': row['entry_date'].isoformat(),
                'mood': row['mood'],
                'text': row['text'],
                'createdAt': row['created_at'].isoformat()
            }
            
            conn.close()
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            entry_id = query_params.get('id')
            
            if not entry_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Entry ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                DELETE FROM diary_entries 
                WHERE id = %s AND user_id = %s
            ''', (entry_id, user_id))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        conn.close()
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
