import { useEffect, useState } from "react";
import { geminiClient } from "../geminiClient/geminiClient";


export default function UserTable() {
    const [users, setUsers] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            console.log(geminiClient.getCurrentServer());
            if (geminiClient.getCurrentServer() === 'userTable-mcp') {
                console.log('Users Table MCP is connected');
                setIsConnected(true);
                const result = await geminiClient.callTool('get-all-users', {});
                console.log(result);
            } else {
                setIsConnected(false);
                console.log('Users Table MCP is not connected');
            }
        }
        
        // console.log(isConnected ? 'Users Table MCP is connected' : 'Users Table MCP is not connected');
    
        fetchUsers();
    }, [geminiClient.getCurrentServer() === 'userTable-mcp']);


    // useEffect(() => {
    //     if (geminiClient.getCurrentServer() === 'userTable-mcp') {
            
    //     }

    // }, [geminiClient.chat]);



    return (
        <div>
            <h1>Users Table</h1>
            <p>Users Table MCP is {isConnected ? 'connected' : 'not connected'}</p>
            <p>Users: {users.length}</p>
            <ul>
                {users.map((user) => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        </div>
    )
}