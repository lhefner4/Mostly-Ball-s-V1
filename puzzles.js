// Daily puzzle schedule for Do You Know Ball?
// To add a new day: add a new "YYYY-MM-DD" entry and push to GitHub.
// weekBadge: plain text, ~30 chars max. gridLabel: plain text, ~35 chars max.
const PUZZLES = {
  "2026-03-22": {
    weekBadge: "WEEK 1: THIS IS MARCH",
    gridLabel: "GRID #1: BLUE BLOOD BALLERS",
    columns: [
      { name: "Duke",      nickname: "Blue Devils", color: "#00539B", border: "#1a7fd4" },
      { name: "UConn",     nickname: "Huskies",     color: "#000E2F", border: "#1a3a88" },
      { name: "Villanova", nickname: "Wildcats",    color: "#003366", border: "#1a5599" },
      { name: "UNC",       nickname: "Tar Heels",   color: "#4B9CD3", border: "#7bbde8" },
    ],
    rows: [
      { name: "Ball Hog",     desc: "Led team in scoring during a Tournament run" },
      { name: "Clutch Balls", desc: "Hit a game-winning shot in March Madness" },
      { name: "Ball Knower",  desc: "Became a broadcaster, analyst, or major media figure" },
      { name: "Ball & Chain", desc: "Won a national championship in their 4th year or more" },
    ],
    answerPool: {
      "0-0": ["Christian Laettner","J.J. Redick","Jay Williams","Shane Battier","Nolan Smith","Tyus Jones","Paolo Banchero","Grayson Allen","Zion Williamson","Johnny Dawkins","Danny Ferry","Jahlil Okafor"],
      "0-1": ["Kemba Walker","Rip Hamilton","Ben Gordon","Shabazz Napier","Ray Allen","Emeka Okafor","Tristen Newton","Jordan Hawkins"],
      "0-2": ["Jalen Brunson","Scottie Reynolds","Allan Ray","Randy Foye","Collin Gillespie","Ryan Arcidiacono","Kris Jenkins","Donte DiVincenzo","Ed Pinckney","Dwayne McClain"],
      "0-3": ["James Worthy","Donald Williams","Sean May","Tyler Hansbrough","Joel Berry II","Wayne Ellington","Marvin Williams","Caleb Love"],
      "1-0": ["Christian Laettner","Tyus Jones"],
      "1-1": ["Kemba Walker","Shabazz Napier","Khalid El-Amin","Rip Hamilton"],
      "1-2": ["Kris Jenkins","Scottie Reynolds","Jalen Brunson"],
      "1-3": ["Charlie Scott","Michael Jordan","Luke Maye","Donald Williams","Caleb Love"],
      "2-0": ["Grant Hill","Jay Bilas","J.J. Redick","Dick Vitale","Seth Davis","Jay Williams","Jim Spanarkel"],
      "2-1": ["Donny Marshall","Rebecca Lobo","Gino Auriemma","Tate George","Donyell Marshall"],
      "2-2": ["Jay Wright","Ed Pinckney"],
      "2-3": ["Antawn Jamison","Brad Daugherty","Eric Montross","Hubert Davis","James Worthy","Joel Berry II","Justin Jackson","Kenny Smith","Marcus Ginyard","Pete Chilcutt","Phil Ford","Rasheed Wallace","Rick Fox","Theo Pinson","Tyler Hansbrough","Tyler Zeller","Vince Carter","Billy Cunningham"],
      "3-0": ["Shane Battier","Clay Buckley","Ron Burt","Ryan Caldbeck","Quinn Cook","Jordan Davidson","Brian Davis","Nate James","Sean Kelly","Greg Koubek","Christian Laettner","J.D. Simpson","Jon Scheyer","Lance Thomas","Brian Zoubek"],
      "3-1": ["Antric Klaiber","Andrew Hurley","Charles Okwandu","Donnell Beverly","E.J. Harrison","Joey Calcaterra","Justin Evanovich","Kyle Bailey","Lasan Kromah","Nahiem Alleyne","Niels Giffey","Rashamel Jones","Ricky Moore","Ryan Swaller","Shabazz Napier","Shamon Tooles","Taliek Brown","Tristen Newton","Tyler Olander"],
      "3-2": ["Ed Pinckney","Dwayne McClain","Gary McLain","Brian Harrington","Ryan Arcidiacono","Daniel Ochefu","Patrick Farrell","Kevin Rafferty","Henry Lowe","Denny Grace","Matt Kennedy","Tom Leibig","Eric Paschall"],
      "3-3": ["Lennie Rosenbluth","Tony Radovich","Bob Young","Jimmy Black","Chris Brust","Jeb Barlow","George Lynch","Henrik Rodl","Matt Wenstrom","Scott Cherry","Travis Stephenson","Jawad Williams","Jackie Manuel","Melvin Scott","C.J. Hooker","Tyler Hansbrough","Danny Green","Bobby Frasor","J.B. Tanner","Patrick Moody","Mike Copeland","Jack Wooten","Marcus Ginyard","Kennedy Meeks","Isaiah Hicks","Nate Britt","Stilman White","Kanler Coker"],
    },
  },
};
