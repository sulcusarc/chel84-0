// Page copy for How It Works and About, taken from the Figma frames.
export type Block =
  | { t: "p"; x: string }
  | { t: "ul"; x: string[] }
  | { t: "formula"; x: string[] }
  | { t: "callout"; h: string; x: string }
  | { t: "table"; head: string[]; rows: string[][]; hl?: number[]; mono?: number[] }
  | { t: "steps"; x: [string, string][] };
export interface Section { id: string; nav: string; title: string; blocks: Block[] }
export interface Page { eyebrow: string; title: string[]; lede: string; tiles?: [string, string][]; sections: Section[] }

export const HOW: Page = {
  eyebrow: "[HOW IT WORKS]",
  title: ["SIX SPINS. SIX PICKS.", "84 GAMES. LOSE NONE."],
  lede: "Chel 84-0 hands you a random roster from a random decade. Take one player, spin again, and keep going until your starting six is full. Then your lineup plays a full 84-game season. The goal is the one thing nobody has ever done: go 84-0.",
  sections: [
    { id: "the-draft", nav: "The draft", title: "THE DRAFT", blocks: [
      { t: "p", x: "Every spin lands on a decade (the 1970s through the 2020s) and a franchise as it was in that decade. That makes 173 rosters across 43 team identities, including teams that have since moved, like the Quebec Nordiques and the Hartford Whalers." },
      { t: "p", x: "Each roster shows its 20-man depth chart: 4 centers, 4 left wings, 4 right wings, 6 defensemen and 2 goalies. Take one player and he fills a spot in your starting six: C, LW, RW, two D and a G. Then you spin again." },
      { t: "ul", x: [
        "Centers, defensemen and goalies only play their own position. Wingers can play either wing.",
        "A player can only be drafted once, even if he shows up on more than one roster (Lidstrom was a Red Wing in the 1990s and the 2000s).",
        "The same roster can come up again later in your draft.",
        "A player’s rating comes from his best season on that roster, so the same player can be rated differently on different teams."
      ] }
    ] },
    { id: "re-rolls", nav: "Re-rolls", title: "RE-ROLLS", blocks: [
      { t: "p", x: "Every draft comes with one decade re-roll and one franchise re-roll. A decade re-roll keeps the team and changes the decade. A franchise re-roll keeps the decade and changes the team. You can spend both on the same spin, which is basically a full do-over. Once they’re gone, they’re gone." }
    ] },
    { id: "bonuses", nav: "Bonuses", title: "BONUSES", blocks: [
      { t: "p", x: "Build your six the right way and players get a boost. Bonuses add points to each covered player’s rating, up to a max of 99, and they stack." },
      { t: "table", head: ["BONUS", "HOW TO GET IT", "WHO GETS IT"], rows: [
        ["Conference +2", "Your whole forward line, or both defensemen, played in the same conference in their decade. It’s era-accurate: Detroit in the 1990s counts as West, even though the Red Wings play in the East today.", "Each player on that line"],
        ["Original Six +6", "All six players come from Original Six franchises: Boston, Chicago, Detroit, Montreal, the Rangers or Toronto. Any mix counts.", "All six"],
        ["??? +10", "There’s one more. It takes three specific players. Fans of a certain hockey podcast might figure it out.", "Those three"]
      ] },
      { t: "callout", h: "HOW RARE?", x: "In simulated drafts, the average draft picks up about three-quarters of a Conference bonus. All six from the Original Six happens in roughly 1 draft in 7,000. In ICE-IQ, bonuses still count, but nothing on screen tells you about them." }
    ] },
    { id: "team-rating", nav: "Team rating", title: "TEAM RATING", blocks: [
      { t: "p", x: "Your team rating is a weighted average of your six. The goalie matters most, then the center." },
      { t: "formula", x: ["Team rating = 0.26 G + 0.20 C + 0.15 LW + 0.15 RW + 0.12 D + 0.12 D + bonuses"] },
      { t: "table", head: ["SLOT", "WEIGHT", "EXAMPLE PLAYER", "RATING", "ADDS"], mono: [1, 3, 4], hl: [7], rows: [
        ["G", "26%", "Ken Dryden, 1970s Canadiens", "97", "25.2"],
        ["C", "20%", "Bryan Trottier, 1970s Islanders", "97", "19.4"],
        ["LW", "15%", "Bill Barber, 1970s Flyers", "93", "14.0"],
        ["RW", "15%", "Jari Kurri, 1980s Oilers", "96", "14.4"],
        ["D", "12%", "Paul Coffey, 1980s Oilers", "99", "11.9"],
        ["D", "12%", "Larry Robinson, 1970s Canadiens", "98", "11.8"],
        ["", "", "Conference bonus: forwards all West (+2 each)", "", "+1.0"],
        ["", "", "Team rating", "", "97.6"]
      ] }
    ] },
    { id: "the-season", nav: "The season", title: "THE SEASON", blocks: [
      { t: "p", x: "Each season builds a fresh league of 31 opponents. Their ratings are spread around an average of 84.8, give or take about 3.5. Then you play 84 games, and every game comes down to the gap between your rating and theirs." },
      { t: "formula", x: ["Chance to win a game = 1 / (1 + e^(−gap / 2.5))"] },
      { t: "table", head: ["RATING GAP", "EVEN", "+2.5", "+5", "+7.5", "+10", "+12.5"], mono: [1, 2, 3, 4, 5, 6], rows: [
        ["Chance to win one game", "50.0%", "73.1%", "88.1%", "95.3%", "98.2%", "99.3%"]
      ] },
      { t: "callout", h: "WHY 84-0 IS SO HARD", x: "Going 84-0 means winning every single game, so the per-game chance gets multiplied by itself 84 times. Even at a 99% chance per game, the odds of a perfect season are only 43%. At 95%, they’re about 1 in 74." },
      { t: "p", x: "Here’s how team rating turns into seasons, from 20,000 simulated seasons at each rating:" },
      { t: "table", head: ["TEAM RATING", "AVERAGE RECORD", "CHANCE OF 84-0"], mono: [0, 1, 2], rows: [
        ["90", "69-15", "under 0.01%"], ["92", "76-8", "0.02%"], ["94", "80-4", "1.8%"], ["95", "81-3", "5.3%"],
        ["96", "82-2", "12.6%"], ["97", "83-1", "23%"], ["98", "83-1", "36%"]
      ] },
      { t: "p", x: "For reference, a draft that simply takes the best available player every time lands around a 90.6 team rating and 72 wins. It goes 84-0 about once in every 900 drafts." }
    ] },
    { id: "results", nav: "Results", title: "RESULTS", blocks: [
      { t: "p", x: "After the season you get your record, your tier, the odds that this exact lineup and schedule would have gone 84-0, and where you rank among everyone who played today." },
      { t: "table", head: ["WINS", "TIER"], mono: [0], hl: [0], rows: [
        ["84", "Perfect Season"], ["76 to 83", "Untouchable"], ["66 to 75", "All-Time Great"], ["56 to 65", "Powerhouse"],
        ["46 to 55", "Contender"], ["36 to 45", "Bubble Team"], ["35 or fewer", "Lottery Pick"]
      ] }
    ] },
    { id: "game-modes", nav: "Game modes", title: "GAME MODES", blocks: [
      { t: "table", head: ["MODE", "HOW IT PLAYS"], rows: [
        ["Classic", "Every player shows his rating and the stat line from his best season on that roster. Bonuses are previewed as you pick."],
        ["ICE-IQ", "Names only. No ratings, no stats, no hints, and each group is sorted A to Z. Bonuses still count, but you have to know them. Your results show what you earned."],
        ["Cap Cup", "Face one of the ten winningest regular seasons in NHL history, under a $28M salary cap. Every player has a price, and stars cost the most. Beat their record, scaled to 84 games, to win the Cup. If nobody on a roster fits your budget, you get a free re-spin."]
      ] },
      { t: "formula", x: ["Wins to beat = their wins ÷ their games × 84, then one more", "1976–77 Canadiens: 60 ÷ 80 × 84 = 63.0, so you need 64"] }
    ] },
    { id: "leaderboard", nav: "Leaderboard", title: "LEADERBOARD", blocks: [
      { t: "ul", x: [
        "Every finished season ranks against everyone who played that mode today. Record comes first; team rating breaks ties.",
        "The board resets every night at midnight Eastern.",
        "Play as many times as you want. Your latest season replaces your row, even if it’s worse, so every run counts.",
        "Pick a display name once and your seasons post under it. Offensive names are blocked, and anyone can report a name."
      ] }
    ] }
  ]
};

export const ABOUT: Page = {
  eyebrow: "[ABOUT]",
  title: ["BUILT BY A FAN.", "RATED BY THE NUMBERS."],
  lede: "Every rating in Chel 84-0 comes from real season stats, adjusted for the era they were played in. Here’s exactly where the numbers come from and how they’re built.",
  tiles: [["55", "SEASONS"], ["1,394", "TEAM-SEASONS"], ["173", "ROSTERS"], ["3,441", "PLAYERS"], ["43", "TEAM IDENTITIES"]],
  sections: [
    { id: "who-made-this", nav: "Who made this", title: "WHO MADE THIS", blocks: [
      { t: "p", x: "Chel 84-0 is built by an avid fan. Go Flyers." },
      { t: "p", x: "It was inspired by 82-0, which asks the same question about basketball. This one is for hockey fans who have spent too long arguing about whether the ’80s Oilers would beat the ’70s Canadiens." }
    ] },
    { id: "the-data", nav: "The data", title: "THE DATA", blocks: [
      { t: "p", x: "Season stats come from the NHL’s public stats service, pulled once and stored, covering every regular season from 1970–71 through 2025–26. That’s 55 seasons (there was no 2004–05 season) and 1,394 team-seasons of standings, player stats, rosters and league totals." },
      { t: "ul", x: [
        "Sweater numbers are the number each player wore most, by games played, for that team in that decade.",
        "One gap: the Cleveland Barons (1976–78) aren’t in the source, so they aren’t in the game yet.",
        "Every rating and GSAA figure is calculated by Chel 84-0 from those raw stats. None of it is copied from another site."
      ] }
    ] },
    { id: "building-rosters", nav: "Building rosters", title: "BUILDING ROSTERS", blocks: [
      { t: "ul", x: [
        "A roster is one team in one decade. A season belongs to the decade it started in, so 1989–90 counts as the 1980s, and Gretzky’s 1979–80 Oilers are their own 1970s roster.",
        "Teams appear as they were. The 1980s Quebec Nordiques and Hartford Whalers are their own rosters, with their own colors, not folded into today’s franchises.",
        "To count, a skater has to play at least half of his team’s games that season. A goalie needs at least 35%.",
        "Each roster keeps its top 20 by rating: 4 centers, 4 left wings, 4 right wings, 6 defensemen and 2 goalies.",
        "A player is rated by his single best season on that roster, not an average. He appears on every roster he played for, so his rating can differ from team to team."
      ] }
    ] },
    { id: "skater-ratings", nav: "Skater ratings", title: "SKATER RATINGS", blocks: [
      { t: "p", x: "A 100-point season meant something different in 1985 than it does today. So instead of raw totals, every skater is measured against the league he actually played in." },
      { t: "steps", x: [
        ["Points per game, against his era", "Divide his points per game by the league average that season, for forwards or for defensemen separately. A defenseman is compared with defensemen."],
        ["Pull small samples toward average", "Add 20 games of league-average play to his line before comparing. A hot 50-game season still shines, but it can’t outrank a great full season on luck alone."],
        ["Even out the extremes", "Put that ratio on a log scale and standardize it across the whole pool, so the gap between 99 and 95 means the same thing at every position."],
        ["Blend in plus/minus", "Add era-adjusted plus/minus, also pulled toward average: 15% of the score for forwards, 35% for defensemen, who rely on it more."],
        ["Scale to a rating", "Rating = 80 + 7 × score, kept between 40 and 99."]
      ] },
      { t: "formula", x: ["IN SHORT", "points index ≈ (PTS + 20 × league PPG) ÷ (GP + 20) ÷ league PPG", "rating = 80 + 7 × score   (40 to 99)"] },
      { t: "table", head: ["PLAYER", "BEST SEASON ON THAT ROSTER", "RATING"], mono: [2], rows: [
        ["Wayne Gretzky, 1980s Oilers", "1983–84: 74 GP, 87 G, 118 A, 205 PTS, +78", "99"],
        ["Mark Messier, 1980s Oilers", "79 GP, 45 G, 84 A, 129 PTS, +19", "93"],
        ["Ryan Whitney, 2000s Penguins", "his best season in Pittsburgh", "89"],
        ["Paul Bissonnette, 2010s Coyotes", "his best season in Arizona", "76"]
      ] }
    ] },
    { id: "goalie-ratings", nav: "Goalie ratings", title: "GOALIE RATINGS", blocks: [
      { t: "p", x: "Goalies are rated on one number: goals saved above average (GSAA). It asks a simple question. Given the shots this goalie faced, how many more goals did he stop than an average goalie that season would have?" },
      { t: "formula", x: ["THE FORMULA", "GSAA = saves − (shots against × league save %)", "per 82 games = GSAA × 82 ÷ games played"] },
      { t: "ul", x: [
        "The league save percentage is worked out fresh for each season from every goalie’s saves and shots, so each goalie is judged against his own era.",
        "Spreading it over 82 games keeps short seasons from being penalized.",
        "The order is strict: a higher GSAA always means a higher rating. Goalies are then placed on the same 40 to 99 scale as skaters, by percentile, so a 92 goalie and a 92 forward are equally rare.",
        "The goalie is also the most important player on your team, worth 26% of your team rating."
      ] },
      { t: "table", head: ["GOALIE", "GSAA PER 82", "RATING"], mono: [1, 2], rows: [
        ["Patrick Roy, 1980s Canadiens", "+48.6", "94"], ["Carey Price, 2010s Canadiens", "+36.7", "91"]
      ] },
      { t: "callout", h: "A QUIRK WORTH KNOWING", x: "Many of the very top goalie ratings belong to the 1970s, like Bernie Parent, Tony Esposito and Ken Dryden. Save percentages varied a lot more back then, so the best goalies could pull further ahead of an average one." }
    ] },
    { id: "conferences", nav: "Conferences", title: "CONFERENCES", blocks: [
      { t: "p", x: "The Conference bonus is era-accurate. Each roster takes the conference its team played in for most of that decade, straight from the real standings. The Wales and Eastern Conferences count as East, the Campbell and Western Conferences as West. 2020–21 had no conferences, so it borrows the nearest season." }
    ] },
    { id: "teams-marks", nav: "Teams & marks", title: "TEAMS & MARKS", blocks: [
      { t: "p", x: "Teams appear by name and colors only. There are no logos, and the jerseys are a generic design in team colors with each player’s real number. Chel 84-0 is not affiliated with, endorsed by or sponsored by the NHL or any of its teams." }
    ] },
    { id: "contact", nav: "Contact", title: "CONTACT", blocks: [
      { t: "ul", x: [
        "Questions, bugs or a rating you want to argue about: puck@chel84-0.com.",
        "See a display name that shouldn’t be on the leaderboard? Tap it and choose Report. Reports are reviewed within 24 hours.",
        "Inspired by 82-0."
      ] }
    ] }
  ]
};
