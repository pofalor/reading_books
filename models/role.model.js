const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Role extends Model {

        static async createNew(roleName, description) {
            return this.create({ name: roleName, description });
        }
    }

    Role.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: false
    });

    return Role;
};