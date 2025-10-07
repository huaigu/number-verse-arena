export default {
  // Common
  common: {
    home: "Home",
    back: "Back",
    loading: "Loading...",
    connectWallet: "Connect Wallet",
    walletConnected: "Wallet Connected",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    leaderboard: "Leaderboard",
    quickJoin: "Quick Join",
    viewGame: "View Game",
    refresh: "Refresh",
    search: "Search",
    copy: "Copy",
    copied: "Copied",
    close: "Close",
    confirm: "Confirm",
    cancel: "Cancel",
  },

  // Landing Page
  landing: {
    title: "Unique Number Game",
    subtitle: "Powered by Zama's fhEVM",
    description: "The world's first privacy-preserving multiplayer number game using Fully Homomorphic Encryption. Your choices stay encrypted on-chain until reveal - no one can see your strategy!",
    warningBanner: "⚠️ Due to ZAMA upgrading to v0.8.0, contracts need to be redeployed - previous data cannot be displayed",

    features: {
      title: "Revolutionary Privacy Features",
      fhePrivacy: {
        title: "FHE Privacy Protection",
        description: "Your number choices remain encrypted on-chain using ZAMA's FHE technology until game completion"
      },
      confidential: {
        title: "Confidential by Design",
        description: "Game logic runs on encrypted data without revealing player selections, ensuring true privacy"
      },
      trustless: {
        title: "Trustless Multiplayer",
        description: "No central authority can see your choices - privacy guaranteed by cryptographic proofs"
      },
      verifiable: {
        title: "Verifiable Fairness",
        description: "All game results are cryptographically verifiable while maintaining complete player privacy"
      }
    },

    howToPlay: {
      title: "How to Play",
      step1: {
        title: "Create or Join Room",
        description: "Set game parameters (players, number range, rewards) or join existing rooms"
      },
      step2: {
        title: "Choose & Encrypt",
        description: "Select your number - it's encrypted using ZAMA FHE and hidden from all players until reveal"
      },
      step3: {
        title: "Cryptographic Reveal",
        description: "When time expires, FHE reveals all choices simultaneously - unique number holders win!"
      }
    },

    faq: {
      title: "Frequently Asked Questions",
      q1: {
        question: "How many players can join a game?",
        answer: "Each game room can have between 2 to 10 players. The room creator sets the maximum number of players when creating the game."
      },
      q2: {
        question: "What number range can I choose?",
        answer: "The default number range is 1-16. Room creators can customize the range, but the difference between maximum and minimum must be less than 256 for optimal FHE performance."
      },
      q3: {
        question: "How much does it cost to play?",
        answer: "The entry fee is set by the room creator when creating the game. All players pay the same entry fee, which forms the prize pool for the winner."
      },
      q4: {
        question: "What happens if no one wins?",
        answer: "If no player chooses a unique number, 90% of the total prize pool is refunded to all participants proportionally, and 10% is collected as a platform fee."
      },
      q5: {
        question: "How is my privacy guaranteed? Can I see others' numbers?",
        answer: "No, it's impossible to see others' numbers before the reveal! Your chosen number is encrypted using ZAMA's Fully Homomorphic Encryption (FHE) technology. All numbers remain completely hidden from all players and even the smart contract until they are revealed simultaneously when the game ends, ensuring complete fairness and privacy."
      },
      q6: {
        question: "When does the game end?",
        answer: "The game ends either when the deadline expires or when all player slots are filled and all players have submitted their numbers."
      },
      q7: {
        question: "How do I claim my prize?",
        answer: "If you win, you can claim your prize by clicking the 'Claim Prize' button on the game page after the game finishes. The prize will be transferred directly to your wallet."
      }
    },

    demoVideo: {
      title: "Watch How It Works",
      description: "See the Unique Number Game in action and learn how privacy-preserving gameplay works"
    },

    footer: {
      copyright: "© 2025 Unique Number Game. Challenge your strategic thinking and enjoy the fun!",
      twitter: "Twitter",
      github: "GitHub"
    }
  },

  // Create Room Page
  createRoom: {
    title: "Create Game Room",
    creating: "Creating room...",
    quickSetup: "Quick Setup",
    quickSetupDesc: "Choose preset configurations to start quickly",
    customSettings: "Custom Settings",
    customSettingsDesc: "Adjust game parameters to fit your needs",

    presets: {
      quick: {
        name: "Quick Game",
        description: "4 players, fast start"
      },
      standard: {
        name: "Standard Game",
        description: "6 players standard"
      },
      challenge: {
        name: "Challenge Mode",
        description: "8 players, high difficulty"
      }
    },

    settings: {
      roomName: "Room Name",
      roomNamePlaceholder: "Enter room name",
      maxPlayers: "Max Players",
      minNumber: "Min Number",
      maxNumber: "Max Number",
      entryFee: "Entry Fee",
      timeLimit: "Time Limit",
      minutes: "minutes",
      hours: "hours"
    },

    preview: {
      title: "Room Preview",
      description: "Review your room settings",
      maxPlayersLabel: "Max Players",
      numberRangeLabel: "Number Range",
      entryFeeLabel: "Entry Fee",
      timeLimitLabel: "Time Limit",

      rules: {
        title: "Game Rules",
        rule1: "• Each player can only choose one number",
        rule2: "• Players who choose unique numbers get rewards",
        rule3: "• Duplicate number choices earn no points",
        rule4: (minutes: number) => `• Must complete selection within ${minutes} minutes`
      }
    },

    buttons: {
      createRoom: "Create Room",
      creating: "Creating Room...",
      connectFirst: "Connect Wallet First",
      joinExisting: "Or Join Existing Room"
    },

    warnings: {
      connectWallet: "Connect your wallet to create a room"
    }
  },

  // Join Room Page
  joinRoom: {
    title: "Join Game Room",
    activeRooms: "Active Rooms",
    activeRoomsDesc: "Quick join available game rooms",
    allRooms: "All Rooms",
    allRoomsDesc: "View completed games and claim rewards if you won",
    noActiveRooms: "No active game rooms available",
    noActiveRoomsDesc: "Create a new room or check back later",
    noAllRooms: "No game rooms found",
    noAllRoomsDesc: "Be the first to create a room!",
    loadingRooms: "Loading rooms...",
    refreshing: "Refreshing...",

    filters: {
      searchPlaceholder: "Search by room ID or creator address..."
    },

    roomCard: {
      creator: "Creator",
      players: "Players",
      numberRange: "Number Range",
      entryFee: "Entry Fee",
      prizePool: "Prize Pool",
      timeLeft: "Time Left",
      expired: "Expired",
      status: "Status",
      joinButton: "Join Room",
      viewButton: "View Results",
      fullButton: "Room Full"
    },

    status: {
      open: "Open",
      calculating: "Calculating",
      finished: "Finished",
      claimed: "Claimed"
    }
  },

  // Game Page
  gamePage: {
    title: "Game Room",
    loading: "Loading game...",
    notFound: "Game not found",
    notFoundDesc: "This game room does not exist or has been removed",

    roomInfo: {
      roomId: "Room ID",
      creator: "Creator",
      status: "Status",
      players: "Players",
      prizePool: "Prize Pool",
      timeLeft: "Time Left",
      expired: "Expired",
      numberRange: "Number Range"
    },

    gameArea: {
      selectNumber: "Select Your Number",
      selectedNumber: "Selected Number",
      notSelected: "Not selected",
      myChoice: "My Choice",
      selected: "Selected",
      submitButton: "Submit Number",
      submitting: "Submitting...",
      submitted: "Number Submitted",
      waitingResults: "Waiting for Results",
      waitingPlayers: "Number submitted successfully! Waiting for other players...",
      noPlayersJoined: "Time expired! No players joined this game.",
      timeExpiredReveal: "Time Expired!",
      gameEndedWithPlayers: (count: number) => `Game ended with ${count} players. Anyone can reveal the winner now!`,
      revealReward: "Reveal reward",
      revealRewardAmount: (amount: string) => `~${amount} ETH (10% of prize pool)`,
      revealWinner: "Reveal Winner & Claim Reward",
      revealing: "Revealing...",
      calculating: "Calculating winner...",
      calculatingDesc: "Please wait while the blockchain determines the winner.",

      results: {
        title: "Game Results",
        winner: "Winner",
        winningNumber: "Winning Number",
        noWinner: "No Winner",
        youWon: "Congratulations! You Won!",
        youLost: "Better luck next time!",
        claimPrize: "Claim Prize",
        claiming: "Claiming...",
        claimed: "Prize Claimed"
      }
    },

    players: {
      title: "Players",
      you: "You",
      submitted: "Submitted",
      waiting: "Waiting"
    },

    actions: {
      finalizeGame: "Finalize Game",
      finalizing: "Finalizing...",
      backToHome: "Back to Home",
      tryAgain: "Try Again"
    }
  },

  // Leaderboard Page
  leaderboard: {
    title: "Leaderboard",
    stats: {
      totalGames: "Total Games",
      totalPlayers: "Total Players",
      totalPrizes: "Total Prizes",
      avgPrize: "Avg Prize/Game"
    },

    actions: {
      clearCache: "Clear Cache"
    },

    topPlayers: {
      title: "Top Players",
      description: "Ranked by total winnings",
      rank: "Rank",
      player: "Player",
      wins: "Wins",
      totalPrizes: "Total Prizes",
      winRate: "Avg Prize",
      noData: "No leaderboard data available"
    },

    recentWinners: {
      title: "Recent Winners",
      description: "Latest game results",
      game: "Game",
      winner: "Winner",
      prize: "Prize",
      number: "Number",
      date: "Date",
      noWinners: "No recent winners"
    },

    userStats: {
      yourRank: "Your Rank",
      notRanked: "Not Ranked",
      gamesPlayed: "Games Played",
      totalWins: "Total Wins"
    },

    search: {
      placeholder: "Search by wallet address..."
    },

    pagination: {
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of"
    }
  },

  // Toast Messages
  toast: {
    // Wallet
    walletNotConnected: {
      title: "Wallet not connected",
      description: "Please connect your wallet to continue."
    },
    walletConnected: {
      title: "Wallet connected",
      description: "Your wallet has been connected successfully."
    },

    // Game Creation
    creatingRoom: {
      title: "Creating room...",
      description: "Please confirm the transaction in your wallet."
    },
    roomCreated: {
      title: "Room created successfully! 🎉",
      description: "Transaction confirmed! Redirecting to game room..."
    },
    roomCreationFailed: {
      title: "Failed to create room",
      description: "Please try again or check your wallet connection."
    },
    transactionFailed: {
      title: "Transaction failed",
      description: "Please try again."
    },

    // Room Validation
    roomNameRequired: {
      title: "Room name required",
      description: "Please enter a room name."
    },
    invalidNumberRange: {
      title: "Invalid number range",
      description: "Maximum number must be greater than minimum number."
    },

    // Join Room
    loadingGames: {
      title: "Loading games...",
      description: "Please wait while we fetch available rooms."
    },
    noAvailableRooms: {
      title: "No available rooms",
      description: "Currently no open game rooms available. Create a new room to start playing!"
    },
    noJoinableRooms: {
      title: "No joinable rooms",
      description: "All available rooms are either full or expired. Try creating a new room!"
    },
    joiningRoom: {
      title: "Joining room...",
      description: (roomId: string) => `Room ID: ${roomId}`
    },
    gameExpired: {
      title: "Game expired",
      description: "This room has expired and cannot be joined."
    },
    viewingExpiredGame: {
      title: "Viewing expired game",
      description: "This game has expired. Viewing results..."
    },
    viewingFinishedGame: {
      title: "Viewing finished game",
      description: "This game has finished. Viewing results..."
    },
    viewingCalculatingGame: {
      title: "Viewing calculating game",
      description: "This game is calculating results..."
    },

    // Number Submission
    selectNumberFirst: {
      title: "Select a number",
      description: "Please select a number before submitting."
    },
    submittingNumber: {
      title: "Submitting number...",
      description: "Please confirm the transaction and wait for encryption..."
    },
    numberSubmitted: {
      title: "Number submitted! 🎉",
      description: "Your encrypted number has been recorded on-chain."
    },
    submissionFailed: {
      title: "Submission failed",
      description: "Please try again."
    },
    alreadySubmitted: {
      title: "Already submitted",
      description: "You have already submitted a number for this game."
    },
    encryptionFailed: {
      title: "Encryption failed",
      description: "Failed to encrypt your number. Please try again."
    },

    // Game Finalization
    finalizingGame: {
      title: "Finalizing game...",
      description: "Triggering winner calculation on-chain..."
    },
    gameFinalized: {
      title: "Game finalized! 🎉",
      description: "Winner has been determined. Check the results!"
    },
    finalizationFailed: {
      title: "Finalization failed",
      description: "Please try again later."
    },
    cannotFinalizeYet: {
      title: "Cannot finalize yet",
      description: "Game deadline has not been reached or all players haven't submitted."
    },

    // Prize Claiming
    claimingPrize: {
      title: "Claiming prize...",
      description: "Please confirm the transaction in your wallet."
    },
    prizeClaimed: {
      title: "Prize claimed! 🎉",
      description: "Congratulations! Your prize has been transferred."
    },
    claimFailed: {
      title: "Claim failed",
      description: "Please try again."
    },
    notWinner: {
      title: "Not a winner",
      description: "You are not eligible to claim prizes for this game."
    },
    alreadyClaimed: {
      title: "Already claimed",
      description: "You have already claimed your prize for this game."
    },

    // Quick Join
    foundRoom: {
      title: "Joining room...",
      description: (players: number, maxPlayers: number) => `Found room with ${players}/${maxPlayers} players!`
    },

    // Leaderboard
    addressCopied: {
      title: "Address copied",
      description: "Wallet address copied to clipboard"
    },
    refreshingData: {
      title: "Refreshing data...",
      description: "Updating leaderboard statistics..."
    },
    cacheCleared: {
      title: "Cache cleared",
      description: "Leaderboard data has been refreshed."
    },

    // Game Page - Winner Info
    winnerInfoLoaded: {
      title: "Winner information loaded! 🎉",
      description: "Game results are now available."
    },
    winnerInfoPending: {
      title: "Winner information pending",
      description: "Please refresh the page manually to see results."
    },
    fetchingWinner: {
      title: "Fetching winner... ({{retryCount}}/{{maxRetries}})",
      description: "Waiting for blockchain confirmation."
    },
    errorFetchingWinner: {
      title: "Error fetching winner",
      description: "Please refresh the page to see results."
    },
    revealFailed: {
      title: "Reveal failed",
      description: "Please try again."
    },
    gameCalculating: {
      title: "Game calculating! 🎲",
      description: "Automatically fetching results..."
    },
    resultsLoaded: {
      title: "Results loaded! 🎉",
      description: "Game calculation complete."
    },
    stillCalculating: {
      title: "Still calculating...",
      description: "You can manually refresh for updates."
    },
    checkingResults: {
      title: "Checking results... ({{retryCount}}/{{maxRetries}})",
      description: "Waiting for blockchain calculation."
    },
    autoRefreshStopped: {
      title: "Auto-refresh stopped",
      description: "Please refresh manually to see results."
    },

    // Game Page - Game Actions
    gameNotAvailable: {
      title: "Game not available",
      description: "This game is no longer accepting submissions."
    },
    cannotSubmit: {
      title: "Cannot submit",
      description: "Please make sure you're connected and have selected a number."
    },
    encryptingNumber: {
      title: "🔐 Encrypting your number...",
      description: "This may take 10-30 seconds due to FHE encryption. Please wait..."
    },
    transactionSubmitted: {
      title: "Transaction submitted",
      description: "Please confirm the transaction in your wallet."
    },
    cannotReveal: {
      title: "Cannot reveal",
      description: "Game ID is missing."
    },
    revealingWinner: {
      title: "Revealing winner...",
      description: "Please confirm the transaction in your wallet."
    },
    cannotClaim: {
      title: "Cannot claim",
      description: "Game ID is missing."
    }
  }
};
