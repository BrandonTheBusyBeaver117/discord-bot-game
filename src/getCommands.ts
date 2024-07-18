import fs from 'fs';
import path from 'path';
import DiscordCommand from './commands/generic_discord_command';

export type CommandMapping = {
    [commandName: string]: DiscordCommand;
};

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

export async function getCommandMappings(): Promise<Map<string, DiscordCommand>> {
    const commandMappings = new Map<string, DiscordCommand>();
    const commands = await getCommands();

    for (const command of commands) {
        if (commandMappings.has(command.data.name)) {
            console.error(
                `Duplicate command name: "${command.data.name}", command names must be unique!`,
            );
        } else {
            commandMappings[command.data.name] = command;
        }
    }

    return commandMappings;
}
