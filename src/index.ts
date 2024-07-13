import { Client } from 'discord.js';
import config from './config';
import * as commandModules from './commands';

import mongoConfig from './mongoconfig';
import { connect } from 'mongoose';

const commands = Object(commandModules);

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages'] });

client.once('ready', async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    if (!mongoConfig.MONGODB_URL) return;

    await connect(mongoConfig.MONGODB_URL || '');

    if (connect) {
        console.log('connected to db');
    } else {
        console.log('failed to connect to db');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    const command = commands[commandName];

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        commands[commandName].execute(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
            });
        }
    }
});

client.login(config.DISCORD_TOKEN);
