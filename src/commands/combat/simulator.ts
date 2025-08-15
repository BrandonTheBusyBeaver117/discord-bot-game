import { Battle, BattleState, Combatant, Move } from './combat_util';
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

    const moveMapSupplier = (combatants: Combatant[]): Map<string, Move> => {
        const moveMap = new Map<string, Move>();

        combatants.forEach((combatant) => {
            const randIndex = Math.floor(Math.random() * combatant.moves.length);
            moveMap.set(combatant.uuid, combatant.moves[randIndex]);
        });

        return moveMap;
    };

    const opponentMapSupplier = (combatants: Combatant[]): Map<string, Combatant> => {
        // This implementation doesn't really need uuid ngl
        // Let's just target random people lmao

        const opponentMap = new Map<string, Combatant>();

        const aliveTeamAMembers = battleState.teams.a.filter((combatant) => combatant.isAlive());
        const aliveTeamBMembers = battleState.teams.b.filter((combatant) => combatant.isAlive());

        combatants.forEach((combatant) => {
            // The opposing team is just the other
            const opposingTeam = combatant.teamId === 'a' ? aliveTeamBMembers : aliveTeamAMembers;

            const randIndex = Math.floor(Math.random() * opposingTeam.length);

            opponentMap.set(combatant.uuid, opposingTeam[randIndex]);
        });

        return opponentMap;
    };

    const battle = new Battle(battleState, uponWinning);

    let turn = 1;
    while (stop == false) {
        console.log('turn ' + turn);
        battle.processTurn(moveMapSupplier, opponentMapSupplier);
        turn++;
    }
    console.log('we done');
};

export default runSimulation;
