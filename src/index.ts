import { Client } from 'discord.js';
import config from './config';
import * as commandModules from './commands';

import mongoConfig from './mongoConfig';
import { connect } from 'mongoose';

const commands = Object(commandModules);

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages'] });

client.once('ready', async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    if (!mongoConfig.MONGODB_URL) return;

    try {
        await connect(mongoConfig.MONGODB_URL);

        if (connect) {
            console.log('connected to db');
        } else {
            console.log('failed to connect to db');
        }
        console.log(`Both db and bot is up and running!`);
    } catch (err) {
        console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err);
        process.exit();
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
        command.execute(interaction, client);
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
