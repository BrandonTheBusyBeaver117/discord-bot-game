import config from './config';

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import { getCommands } from './getCommands';

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
    try {
        const commands = (await getCommands()).map((command) => command.data);

        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        console.log(commands.map((data) => data.name).join('\n'));
        // The put method is used to fully refresh all commands in the guild with the current set
        // Perhaps we need to have a list of all the guilds
        const data = await rest.put(
            Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
            {
                body: commands,
            },
        );

        console.log(`Successfully reloaded ${data['length']} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
