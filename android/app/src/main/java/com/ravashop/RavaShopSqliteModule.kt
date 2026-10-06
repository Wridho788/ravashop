package com.ravashop

import android.database.Cursor
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteCursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteProgram
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap

/**
 * Minimal SQLite bridge (same approach as RavaPOS). Every batch runs inside one
 * transaction; any error, or a statement whose `expectChanges` does not match,
 * rolls the whole batch back.
 */
class RavaShopSqliteModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val db: SQLiteDatabase by lazy {
    context.openOrCreateDatabase(DATABASE_NAME, 0, null).apply { setForeignKeyConstraintsEnabled(true) }
  }

  override fun getName() = "RavaShopSqlite"

  @ReactMethod
  fun execute(sql: String, params: ReadableArray, promise: Promise) {
    try {
      promise.resolve(run(sql, params))
    } catch (error: Exception) {
      reject(promise, error, -1)
    }
  }

  @ReactMethod
  fun executeBatch(statements: ReadableArray, promise: Promise) {
    var index = -1
    try {
      db.beginTransaction()
      val output = Arguments.createArray()
      for (i in 0 until statements.size()) {
        index = i
        val item = statements.getMap(i) ?: throw IllegalArgumentException("Statement $i is empty")
        val params = if (item.hasKey("params") && !item.isNull("params")) item.getArray("params")!! else Arguments.createArray()
        val result = run(item.getString("sql") ?: "", params)
        if (item.hasKey("expectChanges") && !item.isNull("expectChanges")) {
          val expected = item.getInt("expectChanges")
          val actual = result.getDouble("changes").toInt()
          if (expected != actual) throw ExpectChangesException(i, expected, actual)
        }
        output.pushMap(result)
      }
      db.setTransactionSuccessful()
      promise.resolve(output)
    } catch (error: Exception) {
      reject(promise, error, index)
    } finally {
      if (db.inTransaction()) db.endTransaction()
    }
  }

  private fun reject(promise: Promise, error: Exception, index: Int) {
    val info = Arguments.createMap().apply { putInt("index", index) }
    when (error) {
      is ExpectChangesException -> promise.reject("SQLITE_EXPECT", error.message, error, info)
      is SQLiteConstraintException -> promise.reject("SQLITE_CONSTRAINT", error.message, error, info)
      else -> promise.reject("SQLITE_ERROR", error.message, error, info)
    }
  }

  private fun run(sql: String, params: ReadableArray): WritableMap {
    val result = Arguments.createMap()
    val keyword = sql.trimStart().uppercase()
    when {
      keyword.startsWith("PRAGMA") && keyword.contains("=") -> {
        db.execSQL(sql)
        result.putArray("rows", Arguments.createArray())
        result.putDouble("changes", 0.0)
      }
      keyword.startsWith("SELECT") || keyword.startsWith("PRAGMA") || keyword.startsWith("WITH") -> {
        val factory = SQLiteDatabase.CursorFactory { _, driver, editTable, query ->
          bind(query, params)
          SQLiteCursor(driver, editTable, query)
        }
        db.rawQueryWithFactory(factory, sql, null, "").use { cursor ->
          result.putArray("rows", readRows(cursor))
        }
        result.putDouble("changes", 0.0)
      }
      else -> {
        val statement = db.compileStatement(sql)
        statement.use {
          bind(it, params)
          val isWrite = keyword.startsWith("INSERT") || keyword.startsWith("UPDATE") ||
            keyword.startsWith("DELETE") || keyword.startsWith("REPLACE")
          val changes = if (isWrite) it.executeUpdateDelete() else { it.execute(); 0 }
          result.putDouble("changes", changes.toDouble())
        }
        result.putArray("rows", Arguments.createArray())
      }
    }
    return result
  }

  private fun bind(program: SQLiteProgram, params: ReadableArray) {
    for (i in 0 until params.size()) {
      val position = i + 1
      when (params.getType(i)) {
        ReadableType.Null -> program.bindNull(position)
        ReadableType.Boolean -> program.bindLong(position, if (params.getBoolean(i)) 1 else 0)
        ReadableType.Number -> {
          val value = params.getDouble(i)
          if (value == Math.floor(value) && Math.abs(value) <= MAX_SAFE_INTEGER) program.bindLong(position, value.toLong())
          else program.bindDouble(position, value)
        }
        else -> program.bindString(position, params.getString(i) ?: "")
      }
    }
  }

  private fun readRows(cursor: Cursor) = Arguments.createArray().apply {
    while (cursor.moveToNext()) {
      val row = Arguments.createMap()
      for (column in 0 until cursor.columnCount) {
        val name = cursor.getColumnName(column)
        when (cursor.getType(column)) {
          Cursor.FIELD_TYPE_INTEGER -> row.putDouble(name, cursor.getLong(column).toDouble())
          Cursor.FIELD_TYPE_FLOAT -> row.putDouble(name, cursor.getDouble(column))
          Cursor.FIELD_TYPE_NULL -> row.putNull(name)
          else -> row.putString(name, cursor.getString(column))
        }
      }
      pushMap(row)
    }
  }

  private class ExpectChangesException(index: Int, expected: Int, actual: Int) :
    Exception("Statement $index expected $expected change(s) but made $actual")

  companion object {
    const val DATABASE_NAME = "ravashop.db"
    private const val MAX_SAFE_INTEGER = 9007199254740991.0
  }
}
