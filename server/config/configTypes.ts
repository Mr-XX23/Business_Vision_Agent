export interface DatabaseConfig {
  uri: string;
  name: string;
}

export interface AppConfig {
  
  NODE_ENV: string;
  PORT: string;
  API_VERSION: string;
  APP_NAME: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;

   DATABASES: {
    strategy: DatabaseConfig;
    assets: DatabaseConfig;
    usage: DatabaseConfig;
    eventStore: DatabaseConfig;
  };

}