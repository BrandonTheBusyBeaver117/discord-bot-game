import fs from 'fs';
import path from 'path';
import DiscordCommand from './commands/generic_discord_command';

export async function getCommands(): Promise<DiscordCommand[]> {
    // Only goes one folder deep
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        const module = await import(filePath);

        const CommandClass = module.default;

        if (typeof CommandClass === 'function' && new CommandClass().data) {
            commands.push(new CommandClass());
        }
    }

    return commands;
}

export async function getCommandMappings() {
    // Cursed, but forgive me!!!
    const commandMappings = {};
    const commands = await getCommands();

    for (const command of commands) {
        if (command.data.name in commandMappings) {
            console.error(
                `Duplicate command name: "${command.data.name}", command names must be unique!`,
            );
        }

        commandMappings[command.data.name] = command;
    }

    return commandMappings;
}
