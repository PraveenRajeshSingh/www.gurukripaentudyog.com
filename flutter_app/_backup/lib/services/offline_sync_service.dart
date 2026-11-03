import 'dart:async';
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:uuid/uuid.dart';
import 'package:http/http.dart' as http;

class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _initDatabase();
    return _db!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'brick_saas_offline.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        // Cached products for current tenant
        await db.execute('''
          CREATE TABLE products (
            id TEXT PRIMARY KEY,
            tenant_id TEXT,
            sku TEXT,
            name TEXT,
            category TEXT,
            unit_price REAL,
            trolley_capacity INTEGER,
            trolley_rate REAL,
            description TEXT
          )
        ''');

        // Offline queued dispatches & deliveries recorded by drivers/staff
        await db.execute('''
          CREATE TABLE offline_sync_queue (
            id TEXT PRIMARY KEY,
            tenant_id TEXT,
            device_id TEXT,
            entity_name TEXT,
            operation TEXT,
            client_id TEXT,
            payload TEXT,
            created_at TEXT,
            sync_status TEXT DEFAULT 'PENDING'
          )
        ''');
      },
    );
  }

  /// Record an offline action (e.g., driver confirming delivery proof)
  Future<void> queueOfflineAction({
    required String tenantId,
    required String deviceId,
    required String entityName,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    final db = await database;
    final clientId = const Uuid().v4();

    await db.insert('offline_sync_queue', {
      'id': clientId,
      'tenant_id': tenantId,
      'device_id': deviceId,
      'entity_name': entityName,
      'operation': operation,
      'client_id': clientId,
      'payload': jsonEncode(payload),
      'created_at': DateTime.now().toIso8601String(),
      'sync_status': 'PENDING',
    });
  }

  /// Synchronize all pending items to the NestJS Backend
  Future<bool> synchronizePendingQueue({
    required String backendUrl,
    required String tenantId,
    required String deviceId,
    required String userId,
  }) async {
    final db = await database;
    final pending = await db.query(
      'offline_sync_queue',
      where: 'tenant_id = ? AND sync_status = ?',
      whereArgs: [tenantId, 'PENDING'],
    );

    if (pending.isEmpty) return true;

    final entries = pending.map((row) {
      return {
        'entityName': row['entity_name'],
        'operation': row['operation'],
        'clientId': row['client_id'],
        'payload': jsonDecode(row['payload'] as String),
        'clientTimestamp': row['created_at'],
      };
    }).toList();

    try {
      final response = await http.post(
        Uri.parse('$backendUrl/api/v1/sync/push'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'tenantId': tenantId,
          'deviceId': deviceId,
          'userId': userId,
          'entries': entries,
        }),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Mark all pushed records as synced
        await db.update(
          'offline_sync_queue',
          {'sync_status': 'SYNCED'},
          where: 'tenant_id = ? AND sync_status = ?',
          whereArgs: [tenantId, 'PENDING'],
        );
        return true;
      }
      return false;
    } catch (e) {
      // Network failure: records remain safely in SQLite queue for automatic retry
      return false;
    }
  }
}
