import { Client } from 'discord.js';
import config from './config';

import DiscordCommand from './commands/discord_command';
import { getCommandMappings } from './getCommands';
import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
import { loadCards } from './get_cards';
import { startRandomBannerScheduler } from './banner';
dotenv.config();

const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages'] });

// IF we want rls
//export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

let commandMappings: Map<string, DiscordCommand> = null;

client.once('ready', async (readyClient) => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.log('Missing Supabase environment variables');
        process.exit(1);
    }

    try {
        // Loads the cards in the getcards file
        // Also theoretically if this fails, we are not connected to the database
        await loadCards();

        // After loading cards we can start scheduling for the random card banner
        startRandomBannerScheduler();

        commandMappings = await getCommandMappings();

        console.log(`Both db and bot is up and running!`);
        console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    } catch (err) {
        console.log(err);
        process.exit();
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) {
        console.error('Interaction is not a command');
        return;
    }

    if (!commandMappings) {
        console.error('No command mappings');
        return;
    }

    // Bro, what a fancy way to do this lol
    const { commandName } = interaction;

    const command: DiscordCommand = commandMappings.get(commandName);

    if (!command) {
        console.error(`No command matching ${commandName} was found.`);
        return;
    }

    try {
        command.runCommand(interaction, client);
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
