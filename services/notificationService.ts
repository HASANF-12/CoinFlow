
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || 'https://cdn-icons-png.flaticon.com/512/2845/2845894.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2845/2845894.png',
      tag: 'coinflow-alert'
    });
  }
};

export const notifyRecurringProcessed = (count: number) => {
  sendNotification(
    'Automation Success 🔄',
    `We've automatically processed ${count} recurring ${count === 1 ? 'transaction' : 'transactions'} for you.`
  );
};

export const notifyDormancy = (userName: string) => {
  sendNotification(
    `Missed you, ${userName}! 👋`,
    "It's been a few days. Why not take 30 seconds to log your latest expenses?"
  );
};

export const checkBudgetAlerts = (categoryName: string, spent: number, limit: number) => {
  const percentage = (spent / limit) * 100;
  
  if (percentage >= 100) {
    sendNotification(
      'Budget Exceeded! ⚠️',
      `You've reached your ${categoryName} limit of ${limit.toFixed(2)}.`
    );
  } else if (percentage >= 80) {
    sendNotification(
      'Budget Warning 🔔',
      `You've used 80% of your ${categoryName} budget.`
    );
  }
};

export const checkGoalMilestones = (goalName: string, current: number, target: number) => {
  if (current >= target) {
    sendNotification(
      'Goal Achieved! 🎉',
      `Congratulations! You saved enough for "${goalName}"!`
    );
  }
};
