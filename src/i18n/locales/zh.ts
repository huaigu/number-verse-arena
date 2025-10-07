export default {
  // 通用
  common: {
    home: "首页",
    back: "返回",
    loading: "加载中...",
    connectWallet: "连接钱包",
    walletConnected: "钱包已连接",
    createRoom: "创建房间",
    joinRoom: "加入房间",
    leaderboard: "排行榜",
    quickJoin: "快速加入",
    viewGame: "查看游戏",
    refresh: "刷新",
    search: "搜索",
    copy: "复制",
    copied: "已复制",
    close: "关闭",
    confirm: "确认",
    cancel: "取消",
  },

  // 首页
  landing: {
    title: "唯一数字游戏",
    subtitle: "由 Zama fhEVM 提供支持",
    description: "全球首款使用全同态加密的隐私保护多人数字游戏。您的选择在揭晓前保持链上加密 - 没有人能看到您的策略！",
    warningBanner: "⚠️ 由于 ZAMA 升级到 v0.8.0，需要重新部署合约 - 原有数据无法显示",

    features: {
      title: "革命性隐私特性",
      fhePrivacy: {
        title: "FHE 隐私保护",
        description: "您的数字选择使用 ZAMA 的 FHE 技术在链上保持加密，直到游戏结束"
      },
      confidential: {
        title: "设计上的机密性",
        description: "游戏逻辑在加密数据上运行，不会泄露玩家选择，确保真正的隐私"
      },
      trustless: {
        title: "去信任化多人游戏",
        description: "没有中心化机构能看到您的选择 - 隐私由加密证明保障"
      },
      verifiable: {
        title: "可验证的公平性",
        description: "所有游戏结果都是密码学可验证的，同时保持完整的玩家隐私"
      }
    },

    howToPlay: {
      title: "如何游玩",
      step1: {
        title: "创建或加入房间",
        description: "设置游戏参数（玩家数、数字范围、奖励）或加入现有房间"
      },
      step2: {
        title: "选择并加密",
        description: "选择您的数字 - 它会使用 ZAMA FHE 加密，对所有玩家隐藏直到揭晓"
      },
      step3: {
        title: "密码学揭晓",
        description: "时间到期时，FHE 同时揭示所有选择 - 选择唯一数字的玩家获胜！"
      }
    },

    faq: {
      title: "常见问题",
      q1: {
        question: "一局游戏最多几个玩家？",
        answer: "每个游戏房间可以容纳 2 到 10 名玩家。房间创建者在创建游戏时设置最大玩家数量。"
      },
      q2: {
        question: "数字范围有什么限制？",
        answer: "您可以选择任意自定义数字范围，但最大数字和最小数字之间的差值必须小于 256，以确保 FHE 的最佳性能。"
      },
      q3: {
        question: "参与游戏需要多少费用？",
        answer: "入场费由房间创建者在创建游戏时设置。所有玩家支付相同的入场费，这些费用组成获胜者的奖金池。"
      },
      q4: {
        question: "如果没人获胜怎么办？",
        answer: "如果没有玩家选择唯一数字，总奖金池的 90% 将按比例退还给所有参与者，10% 作为平台费用收取。"
      },
      q5: {
        question: "如何保证我的隐私？",
        answer: "您选择的数字使用 ZAMA 的全同态加密（FHE）技术进行加密。在揭晓阶段之前，它对所有玩家甚至智能合约都完全隐藏。"
      },
      q6: {
        question: "游戏什么时候结束？",
        answer: "游戏在截止时间到期或所有玩家槽位已满且所有玩家都提交了数字时结束。"
      },
      q7: {
        question: "如何领取奖金？",
        answer: "如果您获胜，可以在游戏结束后在游戏页面点击「领取奖金」按钮领取奖金。奖金将直接转入您的钱包。"
      },
      q8: {
        question: "能在揭晓前看到别人的数字吗？",
        answer: "不可能！所有数字都使用 FHE 在区块链上加密。它们只能在游戏结束时同时揭晓，确保完全公平。"
      }
    },

    demoVideo: {
      title: "观看Demo视频",
      description: "观看唯一数字游戏实战，了解隐私保护游戏的工作方式"
    },

    footer: {
      copyright: "© 2025 唯一数字游戏。挑战您的策略思维，享受乐趣！",
      twitter: "推特",
      github: "GitHub"
    }
  },

  // 创建房间页面
  createRoom: {
    title: "创建游戏房间",
    creating: "正在创建房间...",
    quickSetup: "快速设置",
    quickSetupDesc: "选择预设配置快速开始",
    customSettings: "自定义设置",
    customSettingsDesc: "调整游戏参数以满足您的需求",

    presets: {
      quick: {
        name: "快速游戏",
        description: "4 名玩家，快速开始"
      },
      standard: {
        name: "标准游戏",
        description: "6 名玩家标准模式"
      },
      challenge: {
        name: "挑战模式",
        description: "8 名玩家，高难度"
      }
    },

    settings: {
      roomName: "房间名称",
      roomNamePlaceholder: "输入房间名称",
      maxPlayers: "最大玩家数",
      minNumber: "最小数字",
      maxNumber: "最大数字",
      entryFee: "入场费",
      timeLimit: "时间限制",
      minutes: "分钟",
      hours: "小时"
    },

    preview: {
      title: "房间预览",
      description: "查看您的房间设置",
      maxPlayersLabel: "最大玩家数",
      numberRangeLabel: "数字范围",
      entryFeeLabel: "入场费",
      timeLimitLabel: "时间限制",

      rules: {
        title: "游戏规则",
        rule1: "• 每位玩家只能选择一个数字",
        rule2: "• 选择唯一数字的玩家获得奖励",
        rule3: "• 重复的数字选择不得分",
        rule4: (minutes: number) => `• 必须在 ${minutes} 分钟内完成选择`
      }
    },

    buttons: {
      createRoom: "创建房间",
      creating: "正在创建房间...",
      connectFirst: "请先连接钱包",
      joinExisting: "或加入现有房间"
    },

    warnings: {
      connectWallet: "连接您的钱包以创建房间"
    }
  },

  // 加入房间页面
  joinRoom: {
    title: "加入游戏房间",
    activeRooms: "活跃房间",
    activeRoomsDesc: "快速加入可用游戏房间",
    allRooms: "所有房间",
    allRoomsDesc: "查看已完成的游戏，如果您获胜可领取奖励",
    noActiveRooms: "暂无活跃游戏房间",
    noActiveRoomsDesc: "创建新房间或稍后再来查看",
    noAllRooms: "未找到游戏房间",
    noAllRoomsDesc: "成为第一个创建房间的人！",
    loadingRooms: "正在加载房间...",
    refreshing: "刷新中...",

    filters: {
      searchPlaceholder: "按房间 ID 或创建者地址搜索..."
    },

    roomCard: {
      creator: "创建者",
      players: "玩家",
      numberRange: "数字范围",
      entryFee: "入场费",
      prizePool: "奖池",
      timeLeft: "剩余时间",
      expired: "已过期",
      status: "状态",
      joinButton: "加入房间",
      viewButton: "查看结果",
      fullButton: "房间已满"
    },

    status: {
      open: "开放中",
      calculating: "计算中",
      finished: "已结束",
      claimed: "已领取"
    }
  },

  // 游戏页面
  gamePage: {
    title: "游戏房间",
    loading: "正在加载游戏...",
    notFound: "未找到游戏",
    notFoundDesc: "此游戏房间不存在或已被移除",

    roomInfo: {
      roomId: "房间 ID",
      creator: "创建者",
      status: "状态",
      players: "玩家",
      prizePool: "奖池",
      timeLeft: "剩余时间",
      expired: "已过期",
      numberRange: "数字范围"
    },

    gameArea: {
      selectNumber: "选择您的数字",
      selectedNumber: "已选数字",
      notSelected: "未选择",
      myChoice: "我的选择",
      selected: "已选择",
      submitButton: "提交数字",
      submitting: "提交中...",
      submitted: "已提交数字",
      waitingResults: "等待结果",
      waitingPlayers: "数字提交成功！等待其他玩家...",
      noPlayersJoined: "时间已到！没有玩家加入此游戏。",
      timeExpiredReveal: "时间已到！",
      gameEndedWithPlayers: (count: number) => `游戏结束，共 ${count} 名玩家。任何人都可以揭晓获胜者！`,
      revealReward: "揭晓奖励",
      revealRewardAmount: (amount: string) => `~${amount} ETH（奖池的 10%）`,
      revealWinner: "揭晓获胜者并领取奖励",
      revealing: "揭晓中...",
      calculating: "正在计算获胜者...",
      calculatingDesc: "请稍候，区块链正在确定获胜者。",

      results: {
        title: "游戏结果",
        winner: "获胜者",
        winningNumber: "获胜数字",
        noWinner: "无获胜者",
        youWon: "恭喜！您赢了！",
        youLost: "下次好运！",
        claimPrize: "领取奖励",
        claiming: "领取中...",
        claimed: "已领取奖励"
      }
    },

    players: {
      title: "玩家",
      you: "您",
      submitted: "已提交",
      waiting: "等待中"
    },

    actions: {
      finalizeGame: "结算游戏",
      finalizing: "结算中...",
      backToHome: "返回首页",
      tryAgain: "重试"
    }
  },

  // 排行榜页面
  leaderboard: {
    title: "排行榜",
    stats: {
      totalGames: "总游戏数",
      totalPlayers: "总玩家数",
      totalPrizes: "总奖金",
      avgPrize: "平均奖金/局"
    },

    actions: {
      clearCache: "清除缓存"
    },

    topPlayers: {
      title: "顶级玩家",
      description: "按总奖金排名",
      rank: "排名",
      player: "玩家",
      wins: "胜场",
      totalPrizes: "总奖金",
      winRate: "平均奖金",
      noData: "暂无排行榜数据"
    },

    recentWinners: {
      title: "最近获胜者",
      description: "最新游戏结果",
      game: "游戏",
      winner: "获胜者",
      prize: "奖金",
      number: "数字",
      date: "日期",
      noWinners: "暂无最近获胜者"
    },

    userStats: {
      yourRank: "您的排名",
      notRanked: "未排名",
      gamesPlayed: "已玩游戏",
      totalWins: "总胜场"
    },

    search: {
      placeholder: "按钱包地址搜索..."
    },

    pagination: {
      previous: "上一页",
      next: "下一页",
      page: "第",
      of: "页，共"
    }
  },

  // Toast 消息
  toast: {
    // 钱包
    walletNotConnected: {
      title: "钱包未连接",
      description: "请连接您的钱包以继续。"
    },
    walletConnected: {
      title: "钱包已连接",
      description: "您的钱包已成功连接。"
    },

    // 游戏创建
    creatingRoom: {
      title: "正在创建房间...",
      description: "请在您的钱包中确认交易。"
    },
    roomCreated: {
      title: "房间创建成功！🎉",
      description: "交易已确认！正在跳转到游戏房间..."
    },
    roomCreationFailed: {
      title: "创建房间失败",
      description: "请重试或检查您的钱包连接。"
    },
    transactionFailed: {
      title: "交易失败",
      description: "请重试。"
    },

    // 房间验证
    roomNameRequired: {
      title: "需要房间名称",
      description: "请输入房间名称。"
    },
    invalidNumberRange: {
      title: "无效的数字范围",
      description: "最大数字必须大于最小数字。"
    },

    // 加入房间
    loadingGames: {
      title: "正在加载游戏...",
      description: "请稍候，我们正在获取可用房间。"
    },
    noAvailableRooms: {
      title: "暂无可用房间",
      description: "当前没有开放的游戏房间。创建新房间开始游戏！"
    },
    noJoinableRooms: {
      title: "暂无可加入房间",
      description: "所有可用房间都已满或过期。尝试创建新房间！"
    },
    joiningRoom: {
      title: "正在加入房间...",
      description: (roomId: string) => `房间 ID：${roomId}`
    },
    gameExpired: {
      title: "游戏已过期",
      description: "此房间已过期，无法加入。"
    },
    viewingExpiredGame: {
      title: "查看已过期游戏",
      description: "此游戏已过期。正在查看结果..."
    },
    viewingFinishedGame: {
      title: "查看已结束游戏",
      description: "此游戏已结束。正在查看结果..."
    },
    viewingCalculatingGame: {
      title: "查看计算中游戏",
      description: "此游戏正在计算结果..."
    },

    // 数字提交
    selectNumberFirst: {
      title: "请选择数字",
      description: "提交前请先选择一个数字。"
    },
    submittingNumber: {
      title: "正在提交数字...",
      description: "请确认交易并等待加密..."
    },
    numberSubmitted: {
      title: "数字已提交！🎉",
      description: "您的加密数字已记录到链上。"
    },
    submissionFailed: {
      title: "提交失败",
      description: "请重试。"
    },
    alreadySubmitted: {
      title: "已提交",
      description: "您已为此游戏提交过数字。"
    },
    encryptionFailed: {
      title: "加密失败",
      description: "无法加密您的数字。请重试。"
    },

    // 游戏结算
    finalizingGame: {
      title: "正在结算游戏...",
      description: "正在触发链上获胜者计算..."
    },
    gameFinalized: {
      title: "游戏已结算！🎉",
      description: "获胜者已确定。查看结果！"
    },
    finalizationFailed: {
      title: "结算失败",
      description: "请稍后重试。"
    },
    cannotFinalizeYet: {
      title: "尚无法结算",
      description: "游戏截止时间未到或所有玩家尚未提交。"
    },

    // 奖励领取
    claimingPrize: {
      title: "正在领取奖励...",
      description: "请在您的钱包中确认交易。"
    },
    prizeClaimed: {
      title: "奖励已领取！🎉",
      description: "恭喜！您的奖励已转账。"
    },
    claimFailed: {
      title: "领取失败",
      description: "请重试。"
    },
    notWinner: {
      title: "非获胜者",
      description: "您没有资格领取此游戏的奖励。"
    },
    alreadyClaimed: {
      title: "已领取",
      description: "您已领取此游戏的奖励。"
    },

    // 快速加入
    foundRoom: {
      title: "正在加入房间...",
      description: (players: number, maxPlayers: number) => `找到房间，当前 ${players}/${maxPlayers} 名玩家！`
    },

    // 排行榜
    addressCopied: {
      title: "地址已复制",
      description: "钱包地址已复制到剪贴板"
    },
    refreshingData: {
      title: "正在刷新数据...",
      description: "正在更新排行榜统计..."
    },
    cacheCleared: {
      title: "缓存已清除",
      description: "排行榜数据已刷新。"
    },

    // 游戏页面 - 获胜者信息
    winnerInfoLoaded: {
      title: "获胜者信息已加载！🎉",
      description: "游戏结果现已可用。"
    },
    winnerInfoPending: {
      title: "获胜者信息待定",
      description: "请手动刷新页面查看结果。"
    },
    fetchingWinner: {
      title: "正在获取获胜者... ({{retryCount}}/{{maxRetries}})",
      description: "等待区块链确认中。"
    },
    errorFetchingWinner: {
      title: "获取获胜者失败",
      description: "请刷新页面查看结果。"
    },
    revealFailed: {
      title: "揭晓失败",
      description: "请重试。"
    },
    gameCalculating: {
      title: "游戏计算中！🎲",
      description: "正在自动获取结果..."
    },
    resultsLoaded: {
      title: "结果已加载！🎉",
      description: "游戏计算完成。"
    },
    stillCalculating: {
      title: "仍在计算中...",
      description: "您可以手动刷新以获取更新。"
    },
    checkingResults: {
      title: "正在检查结果... ({{retryCount}}/{{maxRetries}})",
      description: "等待区块链计算中。"
    },
    autoRefreshStopped: {
      title: "自动刷新已停止",
      description: "请手动刷新查看结果。"
    },

    // 游戏页面 - 游戏操作
    gameNotAvailable: {
      title: "游戏不可用",
      description: "此游戏不再接受提交。"
    },
    cannotSubmit: {
      title: "无法提交",
      description: "请确保您已连接钱包并选择了一个数字。"
    },
    encryptingNumber: {
      title: "🔐 正在加密您的数字...",
      description: "由于 FHE 加密，这可能需要 10-30 秒。请稍候..."
    },
    transactionSubmitted: {
      title: "交易已提交",
      description: "请在钱包中确认交易。"
    },
    cannotReveal: {
      title: "无法揭晓",
      description: "游戏 ID 缺失。"
    },
    revealingWinner: {
      title: "正在揭晓获胜者...",
      description: "请在钱包中确认交易。"
    },
    cannotClaim: {
      title: "无法领取",
      description: "游戏 ID 缺失。"
    }
  }
};
