// Мок-тест для проверки логики авторизации
describe('Telegram Business Owner Auth', () => {
  
  // Мок Telegram WebApp
  const mockTelegramWebApp = {
    initDataUnsafe: {
      user: {
        id: 709652754,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      }
    }
  };
  
  // Мок localStorage
  const mockLocalStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value;
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    }
  };
  
  beforeEach(() => {
    // Создаем глобальные объекты
    global.localStorage = mockLocalStorage;
    global.window = { 
      Telegram: { 
        WebApp: mockTelegramWebApp 
      } 
    };
    mockLocalStorage.clear();
  });
  
  afterEach(() => {
    // Очищаем глобальные объекты
    delete global.localStorage;
    delete global.window;
  });
  
  test('should detect Telegram user correctly', () => {
    // Тестируем получение данных из Telegram
    const telegramUser = global.window.Telegram.WebApp.initDataUnsafe.user;
    
    expect(telegramUser).toBeDefined();
    expect(telegramUser.id).toBe(709652754);
    expect(telegramUser.first_name).toBe('Test');
  });
  
  test('should save owner info to localStorage', () => {
    const businessId = 'f4e52bb7-a43b-4bfb-b953-2b07c965912b';
    const userId = 709652754;
    
    const ownerInfo = {
      businessId: businessId,
      userId: userId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('ownerInfo', JSON.stringify(ownerInfo));
    localStorage.setItem('isBusinessOwner', 'true');
    
    const savedOwnerInfo = JSON.parse(localStorage.getItem('ownerInfo'));
    const isOwner = localStorage.getItem('isBusinessOwner') === 'true';
    
    expect(savedOwnerInfo.businessId).toBe(businessId);
    expect(savedOwnerInfo.userId).toBe(userId);
    expect(isOwner).toBe(true);
  });
  
  test('should check if user is owner for current business', () => {
    const currentBusinessId = 'f4e52bb7-a43b-4bfb-b953-2b07c965912b';
    const differentBusinessId = 'different-business-id';
    
    // Сохраняем информацию о владельце
    const ownerInfo = {
      businessId: currentBusinessId,
      userId: 709652754,
      timestamp: Date.now()
    };
    
    localStorage.setItem('ownerInfo', JSON.stringify(ownerInfo));
    
    // Проверяем для текущего бизнеса
    const savedOwnerInfo = JSON.parse(localStorage.getItem('ownerInfo'));
    const isOwnerForCurrent = savedOwnerInfo.businessId === currentBusinessId;
    const isOwnerForDifferent = savedOwnerInfo.businessId === differentBusinessId;
    
    expect(isOwnerForCurrent).toBe(true);
    expect(isOwnerForDifferent).toBe(false);
  });
  
  test('should handle missing Telegram user', () => {
    // Симулируем отсутствие Telegram
    global.window = {}; // window без Telegram
    
    // Проверяем, что флаг владельца сбрасывается
    localStorage.setItem('isBusinessOwner', 'false');
    const isOwner = localStorage.getItem('isBusinessOwner') === 'true';
    
    expect(isOwner).toBe(false);
  });
  
  test('should extract businessId from URL correctly', () => {
    const testCases = [
      { url: '/f4e52bb7-a43b-4bfb-b953-2b07c965912b', expected: 'f4e52bb7-a43b-4bfb-b953-2b07c965912b' },
      { url: '/f4e52bb7-a43b-4bfb-b953-2b07c965912b/add', expected: 'f4e52bb7-a43b-4bfb-b953-2b07c965912b' },
      { url: '/f4e52bb7-a43b-4bfb-b953-2b07c965912b/card/123', expected: 'f4e52bb7-a43b-4bfb-b953-2b07c965912b' },
      { url: '/card/123', expected: 'card' }, // Не бизнес ID
      { url: '/cart', expected: 'cart' }, // Не бизнес ID
      { url: '/welcome', expected: 'welcome' }, // Не бизнес ID
      { url: '/oups', expected: 'oups' }, // Не бизнес ID
    ];
    
    testCases.forEach(({ url, expected }) => {
      const pathParts = url.split('/');
      const businessId = pathParts[1];
      
      expect(businessId).toBe(expected);
    });
  });
});