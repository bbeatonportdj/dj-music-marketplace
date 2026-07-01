import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

// User Model
export class User extends Model {
  declare id: string;
  declare display_name: string;
  declare email: string;
  declare password_hash: string | null;
  declare role: string;
  declare oauth_provider: string | null;
  declare oauth_id: string | null;
}
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      allowNull: false,
    },
    oauth_provider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    oauth_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Track Model
export class Track extends Model {
  declare id: string;
  declare title: string;
  declare artist: string;
  declare version: string;
  declare version_type: string;
  declare duration: string;
  declare bpm: number;
  declare key: string;
  declare genre: string;
  declare price: number;
  declare audio_url: string;
  declare artwork_url: string;
  declare is_new: boolean;
  declare is_hot: boolean;
}
Track.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    artist: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    version_type: {
      type: DataTypes.STRING,
      defaultValue: 'clean',
    },
    duration: {
      type: DataTypes.STRING,
      defaultValue: '0:00',
    },
    bpm: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    key: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    genre: {
      type: DataTypes.STRING,
      defaultValue: 'Unknown',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      get() {
        const value = this.getDataValue('price');
        return value === null ? 0.0 : parseFloat(value);
      },
    },
    audio_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    artwork_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_new: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_hot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Track',
    tableName: 'tracks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Order Model
export class Order extends Model {
  declare id: string;
  declare user_id: string | null;
  declare total_amount: number;
  declare status: string;
  declare payment_method: string;
  declare promptpay_ref: string | null;
  declare email: string;
  declare items: OrderItem[];
}
Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const value = this.getDataValue('total_amount');
        return value === null ? 0.0 : parseFloat(value);
      },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending', // pending, paid, cancelled
    },
    payment_method: {
      type: DataTypes.STRING,
      defaultValue: 'promptpay',
    },
    promptpay_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// OrderItem Model
export class OrderItem extends Model {
  declare id: string;
  declare order_id: string;
  declare track_id: string | null;
  declare price_at_purchase: number;
}
OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    track_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    price_at_purchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const value = this.getDataValue('price_at_purchase');
        return value === null ? 0.0 : parseFloat(value);
      },
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: false,
  }
);

// Purchase Model (UserPurchases)
export class Purchase extends Model {
  declare user_id: string;
  declare track_id: string;
  declare purchased_at: Date;
  declare download_count: number;
  declare track?: Track;
}
Purchase.init(
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    track_id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    purchased_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    download_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Purchase',
    tableName: 'user_purchases',
    timestamps: false,
  }
);

// Setup Associations
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Track.hasMany(OrderItem, { foreignKey: 'track_id' });
OrderItem.belongsTo(Track, { foreignKey: 'track_id', as: 'track' });

User.belongsToMany(Track, { through: Purchase, foreignKey: 'user_id', as: 'purchasedTracks' });
Track.belongsToMany(User, { through: Purchase, foreignKey: 'track_id' });
Purchase.belongsTo(User, { foreignKey: 'user_id' });
Purchase.belongsTo(Track, { foreignKey: 'track_id', as: 'track' });
