import {
    Client,
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

class DiscordCommand {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    needsClient: boolean = false;

    constructor() {}

    async preExecute(): Promise<void> {}
    async execute(interaction: CommandInteraction): Promise<void> {}
    async executeWithClient(interaction: CommandInteraction, client?: Client): Promise<void> {}

    async runCommand(interaction: CommandInteraction, client: Client): Promise<void> {
        await this.preExecute();
        if (this.needsClient) {
            this.executeWithClient(interaction, client);
        } else {
            this.execute(interaction);
        }
    }
}

export default DiscordCommand;
