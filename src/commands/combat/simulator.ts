import { Battle, BattleState, Combatant } from './combat_util';
import { combatants } from './simulator_constants';

const runSimulation = () => {
    console.log('starting');
    const teamA = combatants.filter((combatant) => combatant.teamId === 'a');
    const teamB = combatants.filter((combatant) => combatant.teamId === 'b');
    const battleState = new BattleState(teamA, teamB);

    let stop = false;
    const uponWinning = (winningTeam: string) => {
        console.log(winningTeam + ' wins!');
        stop = true;
        return true;
    };

    const moveSupplier = (combatant: Combatant) => {
        const randIndex = Math.floor(Math.random() * combatant.moves.length);

        return combatant.moves[randIndex];
    };

    const opponentSupplier = (combatant: Combatant) => {
        // This implementation doesn't really need uuid ngl
        // Let's just target random people lmao

        // The opposing team is just the other
        const opposingTeamId = combatant.teamId === 'a' ? 'b' : 'a';

        const opposingTeam = battleState.teams[opposingTeamId].filter((combatant) =>
            combatant.isAlive(),
        );

        const randIndex = Math.floor(Math.random() * opposingTeam.length);

        return opposingTeam[randIndex];
    };

    const battle = new Battle(battleState, uponWinning);

    let turn = 1;
    while (stop == false) {
        console.log('turn ' + turn);
        battle.processTurn((combatant) => moveSupplier(combatant), opponentSupplier);
        turn++;
    }
    console.log('we done');
};

export default runSimulation;
