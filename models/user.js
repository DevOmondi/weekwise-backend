'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    prompt: DataTypes.STRING,
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    scheduled_messages: {
      type: DataTypes.ARRAY(DataTypes.TEXT), 
      allowNull: true,
      defaultValue: [],
    },
    subscriptionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscriptionStatus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nextMessageDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};