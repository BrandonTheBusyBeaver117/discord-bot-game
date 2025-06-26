// import fs from 'fs';
// import path from 'path';
// import DiscordCommand from './commands/generic_discord_command';
// async function getCommands() {
//     // Only goes one folder deep
//     const commands = [];
//     const commandsPath = path.join(__dirname, 'commands');
//     const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
//     for (const file of commandFiles) {
//         const filePath = path.join(commandsPath, file);

import { getCommandMappings } from './getCommands';

//         const module = await import(filePath);

//         const CommandClass = module.default;

//         const config: Record<string, DiscordCommand> = {};

//         if (typeof CommandClass === 'function') {
//             const commandInstance = new CommandClass();

//             config['aa'] = commandInstance;

//             if (commandInstance.data) {
//                 console.log(commandInstance.data.name);
//             }
//         }
//     }

//     console.log(commands.length);
//     console.log('done');
// }

// getCommands();

async function t() {
    const ob = await getCommandMappings();

    console.log(ob);

    console.log('===================');
    console.log('\n');

    console.log(ob.get('ping'));
    console.log('ba');
}
t();
