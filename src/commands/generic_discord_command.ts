import {
    Client,
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import userSchema from '../schema/user';

class DiscordCommand {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    needsClient: boolean = false;

    constructor() {}

    async preExecute(interaction: CommandInteraction): Promise<void> {
        // Create user account if doesn't exist already
        const userExists = await userSchema.exists({ uuid: interaction.user.id });

        if (!userExists) {
            //TODO: I remember there was a way to instantiate default database values
            await userSchema.create({
                uuid: interaction.user.id,
                inventory: [],
                gems: 0,
                daily_timestamp: new Date('2000-00-00'),
            });
        }
    }

    async execute(interaction: CommandInteraction): Promise<void> {}
    async executeWithClient(interaction: CommandInteraction, client?: Client): Promise<void> {}

    async runCommand(interaction: CommandInteraction, client: Client): Promise<void> {
        await this.preExecute(interaction);
        if (this.needsClient) {
            this.executeWithClient(interaction, client);
        } else {
            this.execute(interaction);
        }
    }
}

export default DiscordCommand;
