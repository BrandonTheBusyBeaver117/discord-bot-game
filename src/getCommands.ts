import fs from 'fs';
import path from 'path';
import DiscordCommand from './commands/discord_command';

export type CommandMapping = {
    [commandName: string]: DiscordCommand;
};

export async function getCommands(): Promise<DiscordCommand[]> {
    const potentialCommandPaths: string[] = [];

    // Thanks to @Smally at https://stackoverflow.com/a/63111390 for writing this
    // recursive function to go through all directories and get files
    function traverseThroughDirectory(directory: string) {
        fs.readdirSync(directory).forEach((file) => {
            const absolutePath = path.join(directory, file);

            if (fs.statSync(absolutePath).isDirectory()) {
                return traverseThroughDirectory(absolutePath);
            } else if (file.endsWith('.js')) {
                return potentialCommandPaths.push(absolutePath);
            }
        });
    }

    const commandsFolder = path.join(__dirname, 'commands');
    traverseThroughDirectory(commandsFolder);

    const commands: DiscordCommand[] = [];

    for (const potentialCommandPath of potentialCommandPaths) {
        const module = await import(potentialCommandPath);

        const commandClass = module.default;

        if (!(typeof commandClass === 'function')) continue;

        const commandInstance = new commandClass();

        if (
            !(
                commandInstance instanceof DiscordCommand &&
                commandInstance.data.name !== 'command_base'
            )
        )
            continue;

        commands.push(commandInstance);
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
            commandMappings.set(command.data.name, command);
        }
    }

    return commandMappings;
}
