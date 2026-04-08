const SAFE_IDENTIFIER = /^[a-z][a-z0-9_]*$/;

const assertSafeIdentifier = (value, label) => {
  if (!SAFE_IDENTIFIER.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
};

export class BaseModel {
  constructor(tableName, db) {
    assertSafeIdentifier(tableName, 'table name');
    this.tableName = tableName;
    this.db = db;
  }

  async findAll({ orderBy = 'created_at', direction = 'DESC' } = {}) {
    assertSafeIdentifier(orderBy, 'order column');
    const safeDirection = String(direction).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const [rows] = await this.db.query(
      `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${safeDirection}`
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async deleteById(id) {
    const [result] = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
