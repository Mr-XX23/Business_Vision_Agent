import mongoose, { Connection } from "mongoose";
import appConfig from "../../config/config.js";
import { DatabaseConfig } from "../../config/configTypes.js";

export class DatabaseManager {
  
    // Singleton instance
    private connections: Map<string, Connection> = new Map();

    //Connect to a specific database
    async connectToDatabase(
        serviceName: string,
        config: DatabaseConfig
    ): Promise<Connection> {
        try {
            if (this.connections.has(serviceName)) {
                const existingConnection = this.connections.get(serviceName);
                if (existingConnection && existingConnection.readyState === 1) {
                    console.log(`🔄 Reusing existing connection for ${serviceName}`);
                    return existingConnection;
                }
            }

            // create a new connection
            const connection = await mongoose.createConnection(config.uri, {
                dbName: config.name,
                maxPoolSize: 10, // Maximum number of socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            });

            // Store connection
            this.connections.set(serviceName, connection);
            console.log(`✅ Connected to ${serviceName} database: ${config.name}`);

            // Handle connection events
            connection.on("error", (error) => {
                console.error(`❌ ${serviceName} database error:`, error);
            });

            connection.on("disconnected", () => {
                console.log(`⚠️ ${serviceName} database disconnected`);
            });

            return connection;
        } catch (error) {
            console.error(`❌ Failed to connect to ${serviceName} database:`, error);
            throw error;
        }
    }

    // Connect to all databases
    async connectAllDatabases(): Promise<void> {
        try {
            console.log("🚀 Connecting to all databases...");
            await Promise.all([
                this.connectToDatabase("strategy", appConfig.DATABASES.strategy),
                this.connectToDatabase("assets", appConfig.DATABASES.assets),
                this.connectToDatabase("usage", appConfig.DATABASES.usage),
                this.connectToDatabase("eventStore", appConfig.DATABASES.eventStore),
            ]);

            console.log("🎯 All databases connected successfully!");
        } catch (error) {
            console.error("❌ Failed to connect to databases:", error);
            throw error;
        }
    }

    // Get connection for a specific service
    getConnection(serviceName: string): Connection {
        const connection = this.connections.get(serviceName);
        if (!connection) {
            throw new Error(`Database connection for ${serviceName} not found`);
        }
        return connection;
    }

    // Disconnect from a specific database
    async disconnectDatabase(serviceName: string): Promise<void> {

        try {
            const connection = this.connections.get(serviceName);
            if (connection) {
                await connection.close();
                this.connections.delete(serviceName);
                console.log(`📤 Disconnected from ${serviceName} database`);
            }
        } catch (error) {
            console.error(`❌ Error disconnecting from ${serviceName} database:`, error);
        }
    }

    // Disconnect from all databases
    async disconnectAllDatabases(): Promise<void> {
        try {
            console.log('📤 Disconnecting from all databases...');
            const disconnectPromises = Array.from(this.connections.keys()).map(
                serviceName => this.disconnectDatabase(serviceName)
            );
            await Promise.all(disconnectPromises);
            console.log('✅ Disconnected from all databases');
        } catch (error) {
            console.error('❌ Error disconnecting from all databases:', error);
        }
    }

    // Get connection status for all databases
    getConnectionStatus(): Record<string, string> {

        const status: Record<string, string> = {};

        this.connections.forEach((connection, serviceName) => {
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            status[serviceName] = states[connection.readyState] || 'unknown';

        });

        return status;
    }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();
