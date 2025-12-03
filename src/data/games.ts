import { Game, Category } from "@/types/game";

export const categories: Category[] = [
  { id: "1", name: "Action", slug: "action", icon: "⚔️", count: 245 },
  { id: "2", name: "Adventure", slug: "adventure", icon: "🗺️", count: 189 },
  { id: "3", name: "Racing", slug: "racing", icon: "🏎️", count: 87 },
  { id: "4", name: "RPG", slug: "rpg", icon: "🎭", count: 156 },
  { id: "5", name: "Simulation", slug: "simulation", icon: "🎮", count: 98 },
  { id: "6", name: "Indie", slug: "indie", icon: "💎", count: 134 },
  { id: "7", name: "Sports", slug: "sports", icon: "⚽", count: 67 },
  { id: "8", name: "Anime", slug: "anime", icon: "🎌", count: 45 },
  { id: "9", name: "Open World", slug: "open-world", icon: "🌍", count: 78 },
  { id: "10", name: "Horror", slug: "horror", icon: "👻", count: 52 },
];

export const games: Game[] = [
  {
    id: "1",
    title: "Cyberpunk 2077",
    slug: "cyberpunk-2077-free-download",
    image: "https://steamrip.com/wp-content/uploads/2020/12/cyberpunk-2077-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2020/12/cyberpunk-2077-preinstalled-steamrip.jpg",
    version: "v2.31",
    category: "Action",
    releaseDate: "2024-12-01",
    size: "70 GB",
    description: "Cyberpunk 2077 is an open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary wrapped up in a do-or-die fight for survival. Improved and featuring all-new free additional content, customize your character and playstyle as you take on jobs, build a reputation, and unlock upgrades.",
    features: [
      "Open World RPG - Explore Night City, a megalopolis obsessed with power, glamour and body modification",
      "Character Customization - Create your own cyberpunk with unique cyberware, skillset and playstyle",
      "Story-Driven Narrative - Take the riskiest job of your life and go after a prototype implant",
      "Next-Gen Graphics - Experience the most visually stunning open world ever created"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit",
        processor: "Intel Core i5-3570K / AMD FX-8310",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 780 / AMD RX 470",
        storage: "70 GB SSD"
      },
      recommended: {
        os: "Windows 11 64-bit",
        processor: "Intel Core i7-12700 / AMD Ryzen 7 7800X3D",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 3070 / AMD RX 6800 XT",
        storage: "70 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [
      "https://steamrip.com/wp-content/uploads/2020/12/cyberpunk-2077-screenshots-steamrip.jpg"
    ],
    developer: "CD PROJEKT RED",
    genre: "Action, RPG, Open World",
    featured: true,
    rating: 4.8,
    platforms: ["PC", "Windows"],
    views: 245678
  },
  {
    id: "2",
    title: "Elden Ring Deluxe Edition",
    slug: "elden-ring-free-download",
    image: "https://steamrip.com/wp-content/uploads/2022/02/elden-ring-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2022/02/elden-ring-preinstalled-steamrip.jpg",
    version: "v1.16.1",
    category: "Action",
    releaseDate: "2024-11-28",
    size: "50 GB",
    description: "THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between. A vast world full of excitement, with a variety of situations and huge dungeons with complex and three-dimensional designs.",
    features: [
      "A Vast World Full of Excitement - A vast world where open fields with a variety of situations and huge dungeons",
      "Create your Own Character - Customize the appearance of your character and freely combine weapons, armor, and magic",
      "An Epic Drama Born from a Myth - A multilayered story told in fragments",
      "Unique Online Play - Connect with other players and travel together"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel Core i5-8400 / AMD Ryzen 3 3300X",
        memory: "12 GB RAM",
        graphics: "NVIDIA GTX 1060 3GB / AMD RX 580 4GB",
        storage: "60 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel Core i7-8700K / AMD Ryzen 5 3600X",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 3060 Ti / AMD RX 6700 XT",
        storage: "60 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "FromSoftware",
    genre: "Action, RPG, Souls-like",
    featured: true,
    rating: 4.9,
    platforms: ["PC", "Windows"],
    views: 189543
  },
  {
    id: "3",
    title: "God of War Ragnarök Digital Deluxe Edition",
    slug: "god-of-war-ragnarok-free-download",
    image: "https://steamrip.com/wp-content/uploads/2024/09/god-of-war-ragnarok-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2024/09/god-of-war-ragnarok-preinstalled-steamrip.jpg",
    version: "v1.0.650.7780",
    category: "Action",
    releaseDate: "2024-11-25",
    size: "85 GB",
    description: "Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go. Witness the changing dynamic of their relationship as they prepare for war; Atreus hungers for knowledge to help him grasp the prophecy of Loki, as Kratos struggles to free himself from the past.",
    features: [
      "Journey Through All Nine Realms - Travel across mythical realms to find answers",
      "Experience Ragnarök - Witness the epic conclusion to the Norse saga",
      "Master New Combat - Wield powerful new weapons and abilities",
      "Explore a Deeper Story - Experience the emotional journey of Kratos and Atreus"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit",
        processor: "Intel i5-4670K / AMD Ryzen 3 1200",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 1060 6GB / AMD RX 5500 XT",
        storage: "190 GB SSD"
      },
      recommended: {
        os: "Windows 11 64-bit",
        processor: "Intel i5-8600K / AMD Ryzen 5 3600",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 3060 / AMD RX 6600 XT",
        storage: "190 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Santa Monica Studio",
    genre: "Action, Adventure",
    featured: true,
    rating: 4.9,
    platforms: ["PC", "Windows"],
    views: 156789
  },
  {
    id: "4",
    title: "Baldur's Gate 3",
    slug: "baldurs-gate-3-free-download",
    image: "https://steamrip.com/wp-content/uploads/2023/08/Baldurs-Gate-3-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2023/08/Baldurs-Gate-3-preinstalled-steamrip.jpg",
    version: "v4.1.1.6995620",
    category: "RPG",
    releaseDate: "2024-11-20",
    size: "120 GB",
    description: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power. Mysterious abilities are awakening inside you, drawn from a mind flayer parasite planted in your brain.",
    features: [
      "An Epic D&D Adventure - Create your character and explore the Forgotten Realms",
      "Turn-Based Combat - Strategic D&D 5th Edition combat",
      "Your Choices Matter - Every decision shapes your story",
      "Online Co-op - Play with up to 4 players in online co-op"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit",
        processor: "Intel i5-4690 / AMD FX 8350",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 970 / AMD RX 480",
        storage: "150 GB SSD"
      },
      recommended: {
        os: "Windows 11 64-bit",
        processor: "Intel i7-8700K / AMD Ryzen 5 3600",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 2060 Super / AMD RX 5700 XT",
        storage: "150 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Larian Studios",
    genre: "RPG, Strategy, Turn-Based",
    featured: true,
    rating: 4.9,
    platforms: ["PC", "Windows"],
    views: 234567
  },
  {
    id: "5",
    title: "Cowboy Life Simulator",
    slug: "cowboy-life-simulator-free-download",
    image: "https://steamrip.com/wp-content/uploads/2025/12/cowboy-life-simulator-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2025/12/cowboy-life-simulator-preinstalled-steamrip.jpg",
    version: "Build 20952129",
    category: "Simulation",
    releaseDate: "2024-12-01",
    size: "6.1 GB",
    description: "Cowboy Life Simulator is an immersive and relaxing single-player Wild West ranching simulator. Step into the boots of a stressed-out businessman who, after a failed venture, decides to change his life and buys a farm in the Wild West.",
    features: [
      "Immersive Open World - Travel across a map filled with diverse locations",
      "Ranch Building - Build your own ranch, construct utility buildings",
      "Farming & Animal Caretaking - Plant, tend to, and harvest over 20 different crops",
      "Engaging Storylines - Dive into the extensive history of Bravestand"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel Core i5-8400 / AMD Ryzen 5 2600",
        memory: "8 GB RAM",
        graphics: "GeForce GTX 1070 8GB",
        storage: "15 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel Core i7-9700K / AMD Ryzen 7 3700X",
        memory: "16 GB RAM",
        graphics: "GeForce RTX 3060",
        storage: "15 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [
      "https://steamrip.com/wp-content/uploads/2025/12/cowboy-life-simulator-screenshots-steamrip.jpg",
      "https://steamrip.com/wp-content/uploads/2025/12/cowboy-life-simulator-steamrip.jpg"
    ],
    developer: "Odd Qubit",
    genre: "Action, Adventure, Simulation",
    rating: 4.0,
    platforms: ["PC", "Windows"],
    views: 11585
  },
  {
    id: "6",
    title: "SLEEP AWAKE",
    slug: "sleep-awake-free-download",
    image: "https://steamrip.com/wp-content/uploads/2025/12/sleep-awake-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2025/12/sleep-awake-preinstalled-steamrip.jpg",
    version: "Build 20850448",
    category: "Action",
    releaseDate: "2024-12-02",
    size: "8 GB",
    description: "A psychological horror game that takes you deep into the realm of nightmares. Explore your darkest fears and face the demons that lurk in your subconscious mind.",
    features: [
      "Psychological Horror - Experience true terror",
      "Dark Atmosphere - Immersive and terrifying environments",
      "Story-Driven - Uncover the mysteries of your mind",
      "Unique Gameplay - Innovative horror mechanics"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel Core i5-4460",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 960",
        storage: "10 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel Core i7-8700",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 2060",
        storage: "10 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Unknown",
    genre: "Action, Horror",
    rating: 4.2,
    platforms: ["PC", "Windows"],
    views: 8934
  },
  {
    id: "7",
    title: "MARVEL Cosmic Invasion",
    slug: "marvel-cosmic-invasion-free-download",
    image: "https://steamrip.com/wp-content/uploads/2025/12/marvel-cosmic-invasion-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2025/12/marvel-cosmic-invasion-preinstalled-steamrip.jpg",
    version: "v1.0.0.12208",
    category: "Action",
    releaseDate: "2024-11-30",
    size: "55 GB",
    description: "Join the Marvel heroes in an epic cosmic battle against universal threats. Choose your favorite superhero and fight to save the universe from destruction.",
    features: [
      "Play as Marvel Heroes - Choose from iconic superheroes",
      "Cosmic Adventure - Travel across the universe",
      "Epic Battles - Face powerful cosmic villains",
      "Multiplayer - Team up with friends"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel Core i5-6600",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 1060",
        storage: "60 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel Core i7-10700",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 3070",
        storage: "60 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Marvel Games",
    genre: "Action, Adventure",
    rating: 4.6,
    platforms: ["PC", "Windows"],
    views: 45678
  },
  {
    id: "8",
    title: "Infinite Lives",
    slug: "infinite-lives-free-download",
    image: "https://steamrip.com/wp-content/uploads/2025/12/infinite-lives-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2025/12/infinite-lives-preinstalled-steamrip.jpg",
    version: "v1.03",
    category: "Action",
    releaseDate: "2024-11-28",
    size: "18 GB",
    description: "A retro-styled platformer with modern gameplay mechanics. Challenge yourself through hundreds of levels and discover what infinite lives truly means.",
    features: [
      "Retro Style - Classic pixel art graphics",
      "Modern Gameplay - Smooth and responsive controls",
      "Hundreds of Levels - Endless challenges await",
      "Secrets to Discover - Hidden areas and collectibles"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel Core i3-4160",
        memory: "4 GB RAM",
        graphics: "NVIDIA GTX 750",
        storage: "20 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel Core i5-8400",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 1060",
        storage: "20 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Indie Studio",
    genre: "Action, Platformer",
    rating: 4.3,
    platforms: ["PC", "Windows"],
    views: 12345
  },
  {
    id: "9",
    title: "Ghost Of Tsushima DIRECTOR'S CUT",
    slug: "ghost-of-tsushima-free-download",
    image: "https://steamrip.com/wp-content/uploads/2024/05/ghost-of-tsushima-directors-cut-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2024/05/ghost-of-tsushima-directors-cut-preinstalled-steamrip.jpg",
    version: "v1053.8.1023.1614",
    category: "Action",
    releaseDate: "2024-11-15",
    size: "75 GB",
    description: "In the late 13th century, the Mongol empire has laid waste to entire nations. Jin Sakai, one of the last surviving samurai, rises from the ashes to fight back. Embrace the way of the Ghost to wage an unconventional war for the freedom of Tsushima.",
    features: [
      "Open World Samurai Adventure - Explore feudal Japan",
      "Beautiful Visuals - Stunning landscapes and environments",
      "Deep Combat System - Master the way of the samurai",
      "Iki Island Expansion - New story content included"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10 64-bit",
        processor: "Intel Core i5-8600 / AMD Ryzen 5 3600",
        memory: "16 GB RAM",
        graphics: "NVIDIA GTX 1060 6GB / AMD RX 5500 XT",
        storage: "75 GB SSD"
      },
      recommended: {
        os: "Windows 11 64-bit",
        processor: "Intel Core i5-10600K / AMD Ryzen 5 5600X",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 3070 / AMD RX 6800",
        storage: "75 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Sucker Punch Productions",
    genre: "Action, Adventure, Open World",
    featured: true,
    rating: 4.8,
    platforms: ["PC", "Windows"],
    views: 178934
  },
  {
    id: "10",
    title: "Forza Horizon 5 Premium Edition",
    slug: "forza-horizon-5-premium-edition-free-download",
    image: "https://steamrip.com/wp-content/uploads/2021/11/forza-horizon-5-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2021/11/forza-horizon-5-preinstalled-steamrip.jpg",
    version: "v1.687.302.0",
    category: "Racing",
    releaseDate: "2024-11-10",
    size: "120 GB",
    description: "Your Ultimate Horizon Adventure awaits! Explore the vibrant and ever-evolving open world landscapes of Mexico with limitless, fun driving action in hundreds of the world's greatest cars.",
    features: [
      "Explore Mexico - A vibrant open world with diverse biomes",
      "Hundreds of Cars - Drive the world's greatest cars",
      "Online Multiplayer - Race with friends and rivals",
      "Stunning Graphics - Next-gen visuals"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel i5-4460 / AMD Ryzen 3 1200",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 970 / AMD RX 470",
        storage: "110 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel i5-8400 / AMD Ryzen 5 1500X",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 3070 / AMD RX 6800 XT",
        storage: "110 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Playground Games",
    genre: "Racing, Open World",
    rating: 4.7,
    platforms: ["PC", "Windows"],
    views: 198765
  },
  {
    id: "11",
    title: "Palworld",
    slug: "palworld-free-download",
    image: "https://steamrip.com/wp-content/uploads/2024/01/palworld-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2024/01/palworld-preinstalled-steamrip.jpg",
    version: "v0.6.8.81654 + Co-op",
    category: "Adventure",
    releaseDate: "2024-11-05",
    size: "30 GB",
    description: "Fight, farm, build and work alongside mysterious creatures called Pals in this completely new multiplayer open world survival and crafting game.",
    features: [
      "Catch and Collect Pals - Over 100 unique Pals to find",
      "Survival Crafting - Build your base and survive",
      "Multiplayer Co-op - Play with up to 32 players",
      "Open World - Explore vast landscapes"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel i5-3570K / AMD FX-8310",
        memory: "16 GB RAM",
        graphics: "NVIDIA GTX 1050 Ti",
        storage: "40 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel i9-9900K / AMD Ryzen 5 3600",
        memory: "32 GB RAM",
        graphics: "NVIDIA RTX 2070",
        storage: "40 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Pocketpair",
    genre: "Adventure, Survival, Crafting",
    rating: 4.5,
    platforms: ["PC", "Windows"],
    views: 287654
  },
  {
    id: "12",
    title: "Solo Leveling: ARISE OVERDRIVE",
    slug: "solo-leveling-arise-overdrive-free-download",
    image: "https://steamrip.com/wp-content/uploads/2025/11/solo-leveling-arise-overdrive-portrait-steamrip.jpg.webp",
    backgroundImage: "https://steamrip.com/wp-content/uploads/2025/11/solo-leveling-arise-overdrive-preinstalled-steamrip.jpg",
    version: "v1.1.70.0 + Co-op",
    category: "Action",
    releaseDate: "2024-11-28",
    size: "25 GB",
    description: "Experience the world of Solo Leveling like never before. Take on the role of Sung Jinwoo and level up from the weakest hunter to the strongest.",
    features: [
      "Based on Popular Manhwa - Authentic Solo Leveling experience",
      "Action Combat - Fast-paced battles",
      "Level Up System - Become stronger with each battle",
      "Co-op Mode - Team up with friends"
    ],
    systemRequirements: {
      minimum: {
        os: "Windows 10",
        processor: "Intel Core i5-6600",
        memory: "8 GB RAM",
        graphics: "NVIDIA GTX 1050 Ti",
        storage: "30 GB"
      },
      recommended: {
        os: "Windows 11",
        processor: "Intel Core i7-8700",
        memory: "16 GB RAM",
        graphics: "NVIDIA RTX 2060",
        storage: "30 GB SSD"
      }
    },
    downloadLinks: [
      { name: "GOFILE", url: "#" },
      { name: "Buzzheavier", url: "#" }
    ],
    screenshots: [],
    developer: "Netmarble",
    genre: "Action, Anime, RPG",
    rating: 4.4,
    platforms: ["PC", "Windows"],
    views: 67890
  }
];

export const featuredGames = games.filter(game => game.featured);
export const recentGames = [...games].sort((a, b) => 
  new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
);
