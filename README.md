# generatev2 Extension



This extension for Visual Studio Code allows you to read JSON configuration files from your project and insert data into a MongoDB database. It connects to the MongoDB database based on the details provided in a `.env` file in your workspace. The extension registers a command `generatev2.generate` to trigger the process.

⚠️ This extension is intended for local use only.

## Features
- ✅ Read JSON files from specified folders.
- ✅ Insert structured data into MongoDB collections.
- ✅ Support for multiple configuration file types (protocols, commands, conditions, etc.).
- ✅ Provides real-time logs in the VS Code Output Channel (Generate v2).

#Config ENV
- DATABASE_URL=your-mongodb-connection-string
- DATABASE_NAME=your-database-name
- COMMON=common-folder-name
