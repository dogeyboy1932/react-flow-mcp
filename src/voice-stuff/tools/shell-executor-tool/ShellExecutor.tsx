// import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
// import { CommandHistoryEntry, ShellToolProps, ToolResponse } from "../../types/tool-types"

// const baseShellUrl = process.env.baseShellUrl;


// // Shell Executor Declaration
// export const EXECUTE_SHELL_COMMAND_DECLARATION: FunctionDeclaration = {
//     name: "execute_shell_command",
//     description: "Executes shell commands and returns their output. Available shells: cmd, powershell, gitbash",
//     parameters: {
//         type: SchemaType.OBJECT,
//         properties: {
//             shell: {
//                 type: SchemaType.STRING,
//                 description: "Shell to use (cmd, powershell, or gitbash)",
//                 enum: ["cmd", "powershell", "gitbash"]
//             },
//             command: {
//                 type: SchemaType.STRING,
//                 description: "The shell command to execute",
//             },
//             workingDir: {
//                 type: SchemaType.STRING,
//                 description: "Working directory for command execution (optional)",
//             }
//         },
//         required: ["shell", "command"],
//     },
// };


// // Shell Service
// export async function executeCommand(shell: string, command: string, workingDir?: string) {
//     const response = await fetch(`http://localhost:3001/api/execute`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ 
//             command: `${shell} /c ${command}`,
//             timeout: 30000 
//         }),
//     });
//     return response.json();
// }


// export const handleShellCommand = async (
//         shell: "cmd" | "powershell" | "gitbash",
//         command: string,
//         workingDir?: string
//     ): Promise<ToolResponse> => {

//     try {
//       const result = await executeCommand(shell, command, workingDir);
//       const newEntry: CommandHistoryEntry = {
//         command: `${shell}: ${command}`,
//         output: result.output || result.error,
//         timestamp: new Date().toISOString(),
//       };
      
//       return { success: result.success, output: newEntry, error: result.error };
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Shell command failed';
    
//       return { success: false, error: errorMessage };
//     }
// };




// function ShellTool({ commandHistory }: ShellToolProps) {

//     return (
//         <div className="space-y-2">
//             {commandHistory.map((entry, index) => (
//                 <div key={index} className="p-3 hover:bg-gray-50">
//                     <div className="font-mono text-sm text-gray-600">$ {entry.command}</div>
//                     {entry.output && (
//                         <pre className="mt-2 text-sm whitespace-pre-wrap text-gray-700">
//                             {entry.output}
//                         </pre>
//                     )}
//                     <div className="mt-1 text-xs text-gray-400">
//                         {new Date(entry.timestamp).toLocaleString()}
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// }

// export default ShellTool;
  