import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { json } from "stream/consumers";
const { MongoClient } = require("mongodb");
const {ssh2} = require('ssh2');

const SSH = new ssh2.Client();

export function activate(context: vscode.ExtensionContext) {
	const folderConfig: string[] = [
		"protocol",
		"validateCommand",
		"command",
		"condition",
		"mappingResponse",
		"responseFormat",
		"responseStatus",
		"resource_profile",
		"resource_token",
	];
	const commonArr: string[] = ["command", "condition","responseStatus"];
	const outputChannel = vscode.window.createOutputChannel("Generate v2");

	const disposable = vscode.commands.registerCommand(
		"generatev2.generate",
		async () => {
			vscode.window.showInformationMessage("กำลัง Insert ข้อมูล");
			outputChannel.appendLine(`-------------- start progress --------------`);
			outputChannel.clear();
			outputChannel.show();
			
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			const pathENV: string = path.join(workspaceFolder!.uri.fsPath, ".env");
			if (workspaceFolder) {
				const projectName = workspaceFolder.name;
			
				try {
					const env = await fs.readFileSync(pathENV, "utf-8");
					const envVars: { [key: string]: string } = {};
					const lines = env.split("\n");

					for (const line of lines) {
						if (line) {
							const key = line.trim().split("=")[0];
							const value = line.trim().split("=")[1].replace(/"/g, "");
							envVars[key] = value;
						}
					}
					const jsonEnv = envVars;
					const conntionString = jsonEnv.DATABASE_URL;
					const collection = jsonEnv.DATABASE_NAME;
					const common = jsonEnv.COMMON;
					const client = new MongoClient(conntionString);
					await client.connect();
					const db = client.db(collection);

					//----------------------------------------------
					for (const key of folderConfig) {
						const array: any[] = [];
						const protocolFolderPath = path.join(
							workspaceFolder.uri.fsPath,
							key
						);
						const files = fs.readdirSync(protocolFolderPath);
						
						for (const file of files) {
							const filePath = path.join(protocolFolderPath, file);

							
							if (file.endsWith('.json')) {
								const fileContent = fs.readFileSync(filePath, 'utf-8');
								const jsonData = JSON.parse(fileContent);
								array.push(jsonData);
								
								// outputChannel.appendLine(`Inserted data from ${file} into ${key}`);
							}
						}
						

						await db.collection(key).deleteMany();
						await db.collection(key).insertMany(array);
						outputChannel.appendLine(`Inserted Config ${files.length} documents into ${key}`);

						

					}

					for (const element of commonArr) {
						const protocolFolderPath = path.join(
							workspaceFolder.uri.fsPath,
							common
						);
						const array: any[] = [];
						const collection = db.collection(element);
						
						const folderPath = path.join(protocolFolderPath, element);
						
						try {
							const files = await fs.readdirSync(folderPath);
							const jsonFiles = files.filter(file => path.extname(file) === '.json');
						
							for (const file of jsonFiles) {
								try {
									const filePath = path.join(folderPath, file);
									const jsonData = await fs.readFileSync(filePath, 'utf-8');
									const data = JSON.parse(jsonData);
					
									// ตรวจสอบข้อมูลก่อนที่จะเพิ่มลงใน array
									// if (data.cm_insertToken || 
									// 	data.cm_updateToken ||
									// 	data.cm_getProfile || 
									// 	data.cm_getToken ||
									// 	data.cd_commonAuthen ||
									// 	data.cd_mapModelResponse ||
									// 	data.re_common) {
									// 	console.log(`Matched file: ${file}`);
										
									// 
									// outputChannel.appendLine(`Inserted data from ${file} into ${element}`);
									array.push(data);
								} catch (readError) {
									console.error(`Error reading file ${file}:`, readError);
								}
							}
					
							// ลบข้อมูลเฉพาะที่ตรงกับเงื่อนไขใน MongoDB ก่อนทำการ insert ใหม่
							if (array.length > 0) {
								// ลบข้อมูลที่ตรงกับเงื่อนไขทั้งหมด
								await collection.deleteMany({
									$or: [
										{ cm_insertToken: { $exists: true } },
										{ cm_updateToken: { $exists: true } },
										{ cm_getProfile: { $exists: true } },
										{ cm_getToken: { $exists: true } },
										{ cd_commonAuthen: { $exists: true } },
										{ cd_mapModelResponse: { $exists: true } },
										{ re_common: { $exists: true } }
									]
								});
								
								// เพิ่มข้อมูลที่กรองแล้ว
								await collection.insertMany(array);
								outputChannel.appendLine(`Inserted Common ${array.length} documents into ${element}`);
							} else {
								console.log(`No matching data to insert in ${element}`);
							}
					
						} catch (dirError) {
							console.error(`Error reading directory ${element}:`, dirError);
						}
					}
					outputChannel.appendLine(`-------------- end progress --------------`);
					vscode.window.showInformationMessage("Insert ข้อมูลเสร็จแล้ว");
				} catch (error) {
					console.log(`log file ENV ==> ",${error}`);
				}
			} else {
				vscode.window.showInformationMessage("ไม่ได้เปิดโปรเจกต์ใดๆ");
			}
		}
	);
	const deployCommand = vscode.commands.registerCommand(
		"generatev2.deploy",  // Change this to match the command name in package.json
		async () => {
			vscode.window.showInformationMessage("กำลัง Deploy");
			outputChannel.appendLine(`-------------- start progress --------------`);
			outputChannel.clear();
			outputChannel.show();
			
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			const pathENV: string = path.join(workspaceFolder!.uri.fsPath, ".env");
			if (workspaceFolder) {
				const projectName = workspaceFolder.name;
			
				try {
					const env = await fs.readFileSync(pathENV, "utf-8");
					const envVars: { [key: string]: string } = {};
					const lines = env.split("\n");

					for (const line of lines) {
						if (line) {
							const key = line.trim().split("=")[0];
							const value = line.trim().split("=")[1].replace(/"/g, "");
							envVars[key] = value;
						}
					}
					const jsonEnv = envVars;
					const conntionString = jsonEnv.DATABASE_URL;
					const collection = jsonEnv.DATABASE_NAME;
					const common = jsonEnv.COMMON;
					const zoneQA = jsonEnv.AUTO_DEPLOY_QA
					
					outputChannel.appendLine(` log ==> ${zoneQA} `);
				// 	const config = {
				// 		host: '',  
				// 		port: 22,       
				// 		username: '',
				// 		password: ''
				// 		// privateKey: require('fs').readFileSync('/path/to/your/private/key'), // คีย์ส่วนตัว
				// 		// // หรือถ้าคุณใช้รหัสผ่าน, คุณสามารถใช้ 'password' แทน
				// 		// // password: 'your-password'
				// 	  };
					  
				// 	  // เชื่อมต่อ SSH
				// 	  SSH.on('ready', () => {
				// 		console.log('SSH Connect ready.');
					  
				// 		// รันคำสั่งบนเซิร์ฟเวอร์
				// 		SSH.exec('kubectl get pod -A', (err:any, stream:any) => {
				// 		  if (err) {
				// 			console.log('Error executing command:', err);
				// 			return;
				// 		  }
					  
				// 		  stream.on('close', (code:any, signal:any) => {
				// 			console.log(`Command finished with code ${code}, signal: ${signal}`);
				// 			SSH.end();
				// 		  }).on('data', (data:any) => {
				// 			console.log('STDOUT:', data.toString());
				// 		  }).on('stderr', (data:any) => {
				// 			console.log('STDERR:', data.toString());
				// 		  });
				// 		});
				// 	  }).on('error', (err:any) => {
				// 		console.error('SSHection error:', err);
				// 	  }).connect(config);

				// }catch(err){

				// }
				// }
				}catch(err:any){

				}
			}
		
		}
	  );
	  context.subscriptions.push(deployCommand);
	context.subscriptions.push(disposable);
}

export function deactivate() { }
