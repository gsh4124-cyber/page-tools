from pathlib import Path
import shutil, re

DIST = Path('dist')
BASE = 'https://gsh4124-cyber.github.io/pc-checkup/'
PAGES = ['index.html','checkup.html','mobile.html','keyboard.html','mouse.html','mic.html','webcam.html','speaker.html','display.html']

COMMON = {
'Language': {'zh-CN':'语言','ru':'Язык'},
'PC Full Check': {'zh-CN':'PC 全面检测','ru':'Полная проверка ПК'},
'Phone Full Check': {'zh-CN':'手机全面检测','ru':'Полная проверка телефона'},
'Keyboard': {'zh-CN':'键盘','ru':'Клавиатура'},
'Mouse': {'zh-CN':'鼠标','ru':'Мышь'},
'Microphone': {'zh-CN':'麦克风','ru':'Микрофон'},
'Camera': {'zh-CN':'摄像头','ru':'Камера'},
'Speaker': {'zh-CN':'扬声器','ru':'Динамик'},
'Display': {'zh-CN':'屏幕','ru':'Экран'},
'Open →': {'zh-CN':'打开 →','ru':'Открыть →'},
'Open Test': {'zh-CN':'打开检测','ru':'Открыть тест'},
'OK': {'zh-CN':'正常','ru':'Норма'},
'Issue': {'zh-CN':'异常','ru':'Проблема'},
'Issue Found': {'zh-CN':'发现异常','ru':'Обнаружена проблема'},
'Unchecked': {'zh-CN':'未检查','ru':'Не проверено'},
'Could Not Check': {'zh-CN':'无法检查','ru':'Не удалось проверить'},
'Reset': {'zh-CN':'重置','ru':'Сбросить'},
'Reset All': {'zh-CN':'全部重置','ru':'Сбросить всё'},
'Reset Results': {'zh-CN':'重置结果','ru':'Сбросить результаты'},
'Stop': {'zh-CN':'停止','ru':'Остановить'},
'Exit': {'zh-CN':'退出','ru':'Выйти'},
'Status:': {'zh-CN':'状态：','ru':'Статус:'},
'Device:': {'zh-CN':'设备：','ru':'Устройство:'},
'Progress': {'zh-CN':'进度','ru':'Прогресс'},
'Overall Progress': {'zh-CN':'总体进度','ru':'Общий прогресс'},
'Pass Criteria': {'zh-CN':'通过标准','ru':'Критерий прохождения'},
'How to Check': {'zh-CN':'检查方法','ru':'Как проверить'},
'What to Check': {'zh-CN':'检查内容','ru':'Что проверить'},
'Limitations': {'zh-CN':'限制','ru':'Ограничения'},
'Test Limitations': {'zh-CN':'检测限制','ru':'Ограничения теста'},
'Privacy': {'zh-CN':'隐私','ru':'Конфиденциальность'},
'Important': {'zh-CN':'重要','ru':'Важно'},
'Waiting': {'zh-CN':'等待中','ru':'Ожидание'},
'Checking': {'zh-CN':'检测中','ru':'Проверка'},
'Stopped': {'zh-CN':'已停止','ru':'Остановлено'},
'Listening': {'zh-CN':'正在监听','ru':'Прослушивание'},
'Left': {'zh-CN':'左','ru':'Левый'},
'Right': {'zh-CN':'右','ru':'Правый'},
'Both': {'zh-CN':'两侧','ru':'Оба'},
'White': {'zh-CN':'白色','ru':'Белый'},
'Black': {'zh-CN':'黑色','ru':'Чёрный'},
'Red': {'zh-CN':'红色','ru':'Красный'},
'Green': {'zh-CN':'绿色','ru':'Зелёный'},
'Blue': {'zh-CN':'蓝色','ru':'Синий'},
}

PHRASES = {
'5-Minute PC & Phone Check | DEVICE CHECKUP': {'zh-CN':'5分钟电脑与手机检测 | DEVICE CHECKUP','ru':'5-минутная проверка ПК и телефона | DEVICE CHECKUP'},
'Check essential PC and phone functions in 5 minutes after purchase or before a used-device deal.': {'zh-CN':'新设备到手后或二手交易前，用浏览器在约5分钟内检查电脑和手机的基本功能。','ru':'Проверьте основные функции ПК и телефона в браузере примерно за 5 минут после покупки или перед сделкой с подержанным устройством.'},
'No install · No sign-up': {'zh-CN':'无需安装 · 无需注册','ru':'Без установки · Без регистрации'},
'New device,': {'zh-CN':'新设备，','ru':'Новое устройство —'},
'basic checks in 5 minutes.': {'zh-CN':'5分钟完成基础检测。','ru':'базовая проверка за 5 минут.'},
'Got a new device or buying/selling used? Quickly check the essential functions in your browser.': {'zh-CN':'刚买到新设备，或准备进行二手交易？直接在浏览器中快速检查关键功能。','ru':'Получили новое устройство или готовитесь к покупке/продаже б/у? Быстро проверьте основные функции прямо в браузере.'},
'5-Minute PC Check': {'zh-CN':'5分钟 PC 检测','ru':'5-минутная проверка ПК'},
'Keyboard · Mouse · Display · Speaker · Microphone · Webcam': {'zh-CN':'键盘 · 鼠标 · 屏幕 · 扬声器 · 麦克风 · 摄像头','ru':'Клавиатура · Мышь · Экран · Динамик · Микрофон · Веб-камера'},
'Start PC Check →': {'zh-CN':'开始 PC 检测 →','ru':'Начать проверку ПК →'},
'5-Minute Phone Check': {'zh-CN':'5分钟手机检测','ru':'5-минутная проверка телефона'},
'Touch · Display · Camera · Microphone · Speaker · Vibration/Rotation': {'zh-CN':'触控 · 屏幕 · 摄像头 · 麦克风 · 扬声器 · 振动/旋转','ru':'Сенсор · Экран · Камера · Микрофон · Динамик · Вибрация/поворот'},
'Start Phone Check →': {'zh-CN':'开始手机检测 →','ru':'Начать проверку телефона →'},
'Pass criteria are simple.': {'zh-CN':'通过标准很简单。','ru':'Критерий прохождения простой.'},
'If the expected response appears and there is no obvious problem, the check passes.': {'zh-CN':'如果出现预期反应且没有明显异常，即可视为通过。','ru':'Если ожидаемая реакция есть и явных проблем нет, проверка считается пройденной.'},
'Individual Tests': {'zh-CN':'单项检测','ru':'Отдельные тесты'},
'You can also open a single test instead of running the full check.': {'zh-CN':'也可以不进行全面检测，直接打开需要的单项测试。','ru':'Можно открыть отдельный тест вместо полной проверки.'},
'Key detection · multi-key input': {'zh-CN':'按键识别 · 多键输入','ru':'Распознавание клавиш · одновременный ввод'},
'Clicks · wheel input': {'zh-CN':'点击 · 滚轮输入','ru':'Клики · колесо'},
'Input level · waveform': {'zh-CN':'输入电平 · 波形','ru':'Уровень входа · форма сигнала'},
'Video · input resolution': {'zh-CN':'视频 · 输入分辨率','ru':'Видео · разрешение входа'},
'Left · right output': {'zh-CN':'左 · 右声道输出','ru':'Левый · правый канал'},
'Colors · dead pixels': {'zh-CN':'颜色 · 坏点','ru':'Цвета · битые пиксели'},
'Only browser-accessible functions are tested. Camera, microphone, and key input are not sent to a server.': {'zh-CN':'仅检测浏览器能够访问的功能。摄像头、麦克风和按键输入不会发送到服务器。','ru':'Проверяются только функции, доступные браузеру. Данные камеры, микрофона и клавиатуры не отправляются на сервер.'},
'5-Minute Full Check': {'zh-CN':'5分钟全面检测','ru':'Полная 5-минутная проверка'},
'5-Minute Full PC Check | PC CHECKUP': {'zh-CN':'5分钟 PC 全面检测 | PC CHECKUP','ru':'Полная 5-минутная проверка ПК | PC CHECKUP'},
'Right after purchase · Before a used-device deal': {'zh-CN':'新机到手后 · 二手交易前','ru':'После покупки · Перед сделкой с б/у устройством'},
'Run each test from top to bottom and mark the result. Progress is stored temporarily in this browser only.': {'zh-CN':'按顺序完成每项检测并标记结果。进度只临时保存在当前浏览器中。','ru':'Пройдите тесты сверху вниз и отметьте результат. Прогресс временно сохраняется только в этом браузере.'},
'Run checks directly in your browser. Camera, microphone, and key input are not sent to a server.': {'zh-CN':'检测直接在浏览器中运行。摄像头、麦克风和按键输入不会发送到服务器。','ru':'Проверки выполняются прямо в браузере. Данные камеры, микрофона и клавиатуры не отправляются на сервер.'},
'Check Progress': {'zh-CN':'检查进度','ru':'Ход проверки'},
'Print / Save PDF': {'zh-CN':'打印 / 保存 PDF','ru':'Печать / Сохранить PDF'},
'Start Next Unchecked Test': {'zh-CN':'开始下一个未检查项目','ru':'Запустить следующий непроверенный тест'},
'Full check complete': {'zh-CN':'全面检测完成','ru':'Полная проверка завершена'},
'1. Keyboard': {'zh-CN':'1. 键盘','ru':'1. Клавиатура'},
'2. Mouse': {'zh-CN':'2. 鼠标','ru':'2. Мышь'},
'3. Monitor': {'zh-CN':'3. 显示器','ru':'3. Монитор'},
'4. Speaker & Headphones': {'zh-CN':'4. 扬声器与耳机','ru':'4. Динамик и наушники'},
'5. Microphone': {'zh-CN':'5. 麦克风','ru':'5. Микрофон'},
'6. Webcam': {'zh-CN':'6. 摄像头','ru':'6. Веб-камера'},
'Check major keys and simultaneous input': {'zh-CN':'检查主要按键和多键同时输入','ru':'Проверка основных клавиш и одновременного ввода'},
'Check buttons, wheel, and double-click anomalies': {'zh-CN':'检查鼠标按键、滚轮和双击异常','ru':'Проверка кнопок, колеса и аномалий двойного клика'},
'Check pixel defects with fullscreen solid colors': {'zh-CN':'使用全屏纯色检查像素缺陷','ru':'Проверка пикселей полноэкранными цветами'},
'Check left/right channels and output': {'zh-CN':'检查左右声道和声音输出','ru':'Проверка левого/правого каналов и звука'},
'Check input level and waveform': {'zh-CN':'检查输入电平和波形','ru':'Проверка уровня входа и формы сигнала'},
'Check video input and resolution': {'zh-CN':'检查视频输入和分辨率','ru':'Проверка видеовхода и разрешения'},
'Back to Full Check': {'zh-CN':'返回全面检测','ru':'Вернуться к полной проверке'},
'Keyboard Test': {'zh-CN':'键盘检测','ru':'Тест клавиатуры'},
'Keyboard Test | PC CHECKUP': {'zh-CN':'键盘检测 | PC CHECKUP','ru':'Тест клавиатуры | PC CHECKUP'},
'Press keys one by one to confirm detection, then press several at once to test simultaneous input.': {'zh-CN':'逐个按键确认是否识别，再同时按多个键测试多键输入。','ru':'Нажимайте клавиши по одной, затем несколько одновременно, чтобы проверить одновременный ввод.'},
'Make sure each key turns green when pressed. Holding a key may trigger normal OS auto-repeat, which is counted separately. Check separately if input continues after release.': {'zh-CN':'确认每个按键按下时会变绿。长按可能触发系统正常的自动重复，会单独计数；松开后若仍持续输入需另行检查。','ru':'Убедитесь, что каждая клавиша подсвечивается при нажатии. Удержание может вызвать нормальный автоповтор ОС; если ввод продолжается после отпускания, проверьте отдельно.'},
'Physical Presses': {'zh-CN':'实际按键次数','ru':'Физические нажатия'},
'OS Auto-repeat': {'zh-CN':'系统自动重复','ru':'Автоповтор ОС'},
'Unique Keys': {'zh-CN':'不同按键数','ru':'Уникальные клавиши'},
'Max Simultaneous': {'zh-CN':'最大同时按键数','ru':'Макс. одновременно'},
'Press a key.': {'zh-CN':'请按下按键。','ru':'Нажмите клавишу.'},
'Mouse & Double-Click Test': {'zh-CN':'鼠标与双击检测','ru':'Тест мыши и двойного клика'},
'Mouse & Double-Click Test | PC CHECKUP': {'zh-CN':'鼠标与双击检测 | PC CHECKUP','ru':'Тест мыши и двойного клика | PC CHECKUP'},
'Check left, right, middle buttons, wheel, pointer movement, and unusually rapid repeated clicks.': {'zh-CN':'检查左键、右键、中键、滚轮、指针移动以及异常快速的重复点击。','ru':'Проверьте левую, правую и среднюю кнопки, колесо, движение указателя и необычно быстрые повторные клики.'},
'First click the left button slowly, one press at a time. The key sign is the count increasing twice from one physical click.': {'zh-CN':'先慢速单击左键，每次只按一下。重点观察一次实际点击是否会让计数增加两次。','ru':'Сначала медленно нажимайте левую кнопку по одному разу. Главный признак — счётчик увеличивается дважды от одного физического клика.'},
'Left Clicks': {'zh-CN':'左键点击','ru':'Левые клики'},
'Right Clicks': {'zh-CN':'右键点击','ru':'Правые клики'},
'Middle Clicks': {'zh-CN':'中键点击','ru':'Средние клики'},
'Wheel Total': {'zh-CN':'滚轮总量','ru':'Колесо всего'},
'Ultra-fast Input Candidates': {'zh-CN':'超快速输入候选','ru':'Подозрительно быстрые вводы'},
'Shortest Gap': {'zh-CN':'最短间隔','ru':'Минимальный интервал'},
'Move and click the mouse in this area.': {'zh-CN':'在此区域移动并点击鼠标。','ru':'Двигайте мышь и нажимайте кнопки в этой области.'},
'Position:': {'zh-CN':'位置：','ru':'Позиция:'},
'Double-Click Judgment Note': {'zh-CN':'双击判断说明','ru':'Примечание о двойном клике'},
'Only extremely short repeated inputs under 80 ms are flagged as a clue. Do not judge a defect from this number alone. The key issue is whether one physical press repeatedly increases the click count by two or more.': {'zh-CN':'仅将低于80毫秒的极短重复输入作为线索。不要仅凭这个数值判定故障；关键是一次实际点击是否反复让计数增加两次或更多。','ru':'Повторы короче 80 мс помечаются только как подсказка. Не судите о неисправности только по этому числу; важно, увеличивается ли счётчик два и более раз от одного физического клика.'},
'Microphone Test': {'zh-CN':'麦克风检测','ru':'Тест микрофона'},
'Microphone Test | PC CHECKUP': {'zh-CN':'麦克风检测 | PC CHECKUP','ru':'Тест микрофона | PC CHECKUP'},
'Allow microphone access to view the real-time input level and waveform in your browser.': {'zh-CN':'允许麦克风权限后，可在浏览器中查看实时输入电平和波形。','ru':'Разрешите доступ к микрофону, чтобы видеть уровень входа и форму сигнала в реальном времени.'},
'Speak or clap once.': {'zh-CN':'说一句话或拍一次手。','ru':'Скажите что-нибудь или хлопните в ладоши.'},
'Start Microphone': {'zh-CN':'启动麦克风','ru':'Запустить микрофон'},
'Audio Input': {'zh-CN':'音频输入','ru':'Аудиовход'},
'This MVP does not send the microphone stream to a server. Closing the page or pressing Stop ends browser input.': {'zh-CN':'本服务不会将麦克风音频流发送到服务器。关闭页面或点击停止即可结束浏览器输入。','ru':'Этот сервис не отправляет поток микрофона на сервер. Закрытие страницы или кнопка «Остановить» прекращает ввод.'},
'Webcam Test': {'zh-CN':'摄像头检测','ru':'Тест веб-камеры'},
'Webcam Test | PC CHECKUP': {'zh-CN':'摄像头检测 | PC CHECKUP','ru':'Тест веб-камеры | PC CHECKUP'},
'Allow camera access to check the live image and active input resolution in your browser.': {'zh-CN':'允许摄像头权限后，可在浏览器中检查实时画面和当前输入分辨率。','ru':'Разрешите доступ к камере, чтобы проверить изображение и активное разрешение входа.'},
'Start Camera': {'zh-CN':'启动摄像头','ru':'Запустить камеру'},
'Video Input': {'zh-CN':'视频输入','ru':'Видеовход'},
'Default Camera': {'zh-CN':'默认摄像头','ru':'Камера по умолчанию'},
'Speaker & Headphone Left/Right Test': {'zh-CN':'扬声器与耳机左右声道检测','ru':'Тест левого/правого канала динамиков и наушников'},
'Left/Right Speaker Test | PC CHECKUP': {'zh-CN':'左右声道扬声器检测 | PC CHECKUP','ru':'Тест левого/правого канала | PC CHECKUP'},
'Lower the volume, then play left, right, and both test tones to check the channels.': {'zh-CN':'先降低音量，再分别播放左声道、右声道和双声道测试音。','ru':'Сначала уменьшите громкость, затем воспроизведите левый, правый и оба канала.'},
'Lower the volume before starting.': {'zh-CN':'开始前请先降低音量。','ru':'Перед началом уменьшите громкость.'},
'LEFT': {'zh-CN':'左','ru':'ЛЕВЫЙ'},
'RIGHT': {'zh-CN':'右','ru':'ПРАВЫЙ'},
'STEREO': {'zh-CN':'双声道','ru':'СТЕРЕО'},
'Confirm that the left test plays only on the left and the right test only on the right. Browser or OS mono-audio settings may combine channels.': {'zh-CN':'确认左声道测试只从左侧播放、右声道测试只从右侧播放。浏览器或系统的单声道设置可能会合并声道。','ru':'Убедитесь, что левый тест звучит только слева, а правый — только справа. Настройки моно в браузере или ОС могут объединять каналы.'},
'A sudden loud tone can be uncomfortable with earphones or headphones.': {'zh-CN':'耳机音量过高时，突然播放测试音可能造成不适。','ru':'Резкий громкий сигнал может быть неприятен в наушниках.'},
'Dead Pixel Test': {'zh-CN':'屏幕坏点检测','ru':'Тест битых пикселей'},
'Dead Pixel Test | PC CHECKUP': {'zh-CN':'屏幕坏点检测 | PC CHECKUP','ru':'Тест битых пикселей | PC CHECKUP'},
'Use solid colors in fullscreen to visually check for bright, dark, or stuck-color pixels.': {'zh-CN':'使用全屏纯色，目视检查亮点、暗点或卡色像素。','ru':'Используйте полноэкранные сплошные цвета, чтобы заметить яркие, тёмные или застрявшие пиксели.'},
'Clean the screen, use the monitor’s native resolution if possible, and check each color.': {'zh-CN':'先清洁屏幕，尽量使用显示器原生分辨率，并逐个检查每种颜色。','ru':'Очистите экран, по возможности используйте родное разрешение монитора и проверьте каждый цвет.'},
'A solid-color visual test can help find pixel defects, but it cannot automatically judge every panel-quality or warranty criterion.': {'zh-CN':'纯色目视检测有助于发现像素缺陷，但无法自动判断所有面板质量或保修标准。','ru':'Тест сплошными цветами помогает найти дефекты пикселей, но не может автоматически оценить все критерии качества панели или гарантии.'},
'5-Minute Phone Check | DEVICE CHECKUP': {'zh-CN':'5分钟手机检测 | DEVICE CHECKUP','ru':'5-минутная проверка телефона | DEVICE CHECKUP'},
'New phone · Before a used-phone deal': {'zh-CN':'新手机到手 · 二手手机交易前','ru':'Новый телефон · Перед сделкой с б/у телефоном'},
'Auto-Judging Policy': {'zh-CN':'自动判定原则','ru':'Правила автоматической оценки'},
'Automatic judgment only uses responses the browser can directly measure. Permission denial or unsupported APIs alone are not treated as device failure.': {'zh-CN':'自动判定仅使用浏览器能够直接测量的响应。权限被拒绝或 API 不支持本身不会被判定为设备故障。','ru':'Автооценка использует только то, что браузер может измерить напрямую. Отказ в разрешении или отсутствие API сами по себе не считаются неисправностью устройства.'},
'1. Touch & Multi-touch': {'zh-CN':'1. 触控与多点触控','ru':'1. Сенсор и мультитач'},
'2. Display Colors & Dead Pixels': {'zh-CN':'2. 屏幕颜色与坏点','ru':'2. Цвета экрана и битые пиксели'},
'3. Front & Rear Cameras': {'zh-CN':'3. 前后摄像头','ru':'3. Передняя и задняя камеры'},
'4. Microphone': {'zh-CN':'4. 麦克风','ru':'4. Микрофон'},
'5. Speaker': {'zh-CN':'5. 扬声器','ru':'5. Динамик'},
'6. Vibration & Screen Rotation': {'zh-CN':'6. 振动与屏幕旋转','ru':'6. Вибрация и поворот экрана'},
'Swipe your finger across the entire test area.': {'zh-CN':'用手指划过整个检测区域。','ru':'Проведите пальцем по всей тестовой области.'},
'Pass when every cell is covered and two-finger input is detected.': {'zh-CN':'覆盖所有格子并检测到双指输入即可通过。','ru':'Тест пройден, когда покрыты все ячейки и обнаружено касание двумя пальцами.'},
'Start Fullscreen Touch Test': {'zh-CN':'开始全屏触控检测','ru':'Запустить полноэкранный тест сенсора'},
'The test closes automatically at 100%.': {'zh-CN':'达到100%后检测会自动关闭。','ru':'При 100% тест закрывается автоматически.'},
'Switch colors and visually inspect the whole screen.': {'zh-CN':'切换颜色并目视检查整个屏幕。','ru':'Переключайте цвета и осматривайте весь экран.'},
'Pass if the screen looks even with no bright, dark, stuck-color spots, or large blotches.': {'zh-CN':'如果屏幕均匀，没有亮点、暗点、卡色点或大面积色斑，即可通过。','ru':'Пройдено, если экран выглядит равномерно без ярких, тёмных, застрявших точек или крупных пятен.'},
'A web page cannot see screen defects itself, so this test is not auto-judged.': {'zh-CN':'网页无法自行看见实体屏幕缺陷，因此此项不自动判定。','ru':'Веб-страница не может сама увидеть физические дефекты экрана, поэтому этот тест оценивается вручную.'},
'Turn on the front and rear cameras once each.': {'zh-CN':'前置和后置摄像头各打开一次。','ru':'Включите переднюю и заднюю камеры по одному разу.'},
'Basic function passes when both camera inputs connect. Check color and blur yourself.': {'zh-CN':'当前后两个摄像头输入都成功连接时，基础功能通过；颜色和模糊情况请自行检查。','ru':'Базовая функция считается исправной, когда подключены обе камеры. Цвет и размытие оцените самостоятельно.'},
'Front Camera': {'zh-CN':'前置摄像头','ru':'Передняя камера'},
'Rear Camera': {'zh-CN':'后置摄像头','ru':'Задняя камера'},
'Marked OK automatically when distinct front and rear inputs are confirmed.': {'zh-CN':'确认前后摄像头为不同输入后自动标记正常。','ru':'Автоматически отмечается как норма после подтверждения разных переднего и заднего входов.'},
'Speak or clap. The result is judged automatically when input response is detected.': {'zh-CN':'说话或拍手。检测到输入响应后会自动判定。','ru':'Скажите что-нибудь или хлопните. Результат оценивается автоматически при обнаружении входного сигнала.'},
'Basic function passes when a sufficient real input signal is detected.': {'zh-CN':'检测到足够的真实输入信号时，基础功能通过。','ru':'Базовая функция считается исправной при обнаружении достаточного реального входного сигнала.'},
'Marked OK automatically when input response is detected.': {'zh-CN':'检测到输入响应后自动标记正常。','ru':'Автоматически отмечается как норма при обнаружении входного сигнала.'},
'Play the test tone once.': {'zh-CN':'播放一次测试音。','ru':'Воспроизведите тестовый сигнал один раз.'},
'Pass if the sound is clear with no severe crackling, dropouts, or silence.': {'zh-CN':'如果声音清晰，没有严重爆音、中断或完全无声，即可通过。','ru':'Пройдено, если звук чистый, без сильного треска, пропаданий или полной тишины.'},
'Play Test Tone': {'zh-CN':'播放测试音','ru':'Воспроизвести тестовый сигнал'},
'The browser can play sound but cannot know whether you actually heard it, so judge this manually.': {'zh-CN':'浏览器可以播放声音，但无法知道你是否真的听到，因此需要手动判断。','ru':'Браузер может воспроизвести звук, но не знает, услышали ли вы его, поэтому оцените вручную.'},
'Tap vibration and rotate the phone between portrait and landscape.': {'zh-CN':'点击振动测试，并在竖屏和横屏之间旋转手机。','ru':'Запустите вибрацию и поверните телефон между портретной и альбомной ориентацией.'},
'Pass if orientation follows the device and vibration is felt on supported devices.': {'zh-CN':'如果屏幕方向会随设备变化，并且在支持的设备上能感受到振动，即可通过。','ru':'Пройдено, если ориентация следует за устройством и на поддерживаемом устройстве ощущается вибрация.'},
'Test Vibration': {'zh-CN':'测试振动','ru':'Проверить вибрацию'},
'Orientation': {'zh-CN':'屏幕方向','ru':'Ориентация'},
'Screen rotation is detected automatically. You must confirm whether vibration was actually felt.': {'zh-CN':'屏幕旋转会自动检测；是否实际感受到振动需要你自行确认。','ru':'Поворот экрана определяется автоматически. Факт вибрации нужно подтвердить самостоятельно.'},
'Battery health, water damage, repair history, storage health, and radio/network performance cannot be accurately judged by a browser alone.': {'zh-CN':'仅靠浏览器无法准确判断电池健康度、进水情况、维修历史、存储健康度以及蜂窝/网络硬件性能。','ru':'Браузер не может точно определить здоровье батареи, следы воды, историю ремонта, состояние накопителя и работу радиомодуля/сети.'},
}

JS_PHRASES = {
'${label} is being used by another app or cannot be opened.': {'zh-CN':'${label} 正被其他应用占用或无法打开。','ru':'${label} используется другим приложением или не может быть открыт.'},
'${label} is unavailable.': {'zh-CN':'${label} 不可用。','ru':'${label} недоступен.'},
'${label} is unavailable. (${err.name || "Unknown error"})': {'zh-CN':'${label} 不可用。(${err.name || "未知错误"})','ru':'${label} недоступен. (${err.name || "Неизвестная ошибка"})'},
'${label} permission is blocked. Check browser site permissions.': {'zh-CN':'${label} 权限被阻止。请检查浏览器的网站权限设置。','ru':'Доступ к ${label} заблокирован. Проверьте разрешения сайта в браузере.'},
'No available ${label} device was found.': {'zh-CN':'未找到可用的${label}设备。','ru':'Доступное устройство ${label} не найдено.'},
'The requested ${label} settings are unavailable. Try another device.': {'zh-CN':'请求的${label}设置不可用。请尝试其他设备。','ru':'Запрошенные настройки ${label} недоступны. Попробуйте другое устройство.'},
'Default microphone': {'zh-CN':'默认麦克风','ru':'Микрофон по умолчанию'},
'Starting microphone': {'zh-CN':'正在启动麦克风','ru':'Запуск микрофона'},
'Starting camera': {'zh-CN':'正在启动摄像头','ru':'Запуск камеры'},
'Camera input active': {'zh-CN':'摄像头输入正常','ru':'Видеовход активен'},
'Test tone played': {'zh-CN':'测试音已播放','ru':'Тестовый сигнал воспроизведён'},
'This browser cannot play the audio test. Try another browser.': {'zh-CN':'此浏览器无法播放音频测试。请尝试其他浏览器。','ru':'Этот браузер не может воспроизвести аудиотест. Попробуйте другой браузер.'},
'Ultra-fast input candidate: ${Math.round(gap)} ms — Do not judge a defect from this alone.': {'zh-CN':'超快速输入候选：${Math.round(gap)} ms — 不要仅凭此项判定故障。','ru':'Очень быстрый ввод: ${Math.round(gap)} мс — не считайте это неисправностью само по себе.'},
'${done} / 6 complete': {'zh-CN':'已完成 ${done} / 6','ru':'Выполнено ${done} / 6'},
'key: ${e.key}  |  code: ${e.code}  |  repeat: ${e.repeat ? "yes":"no"}': {'zh-CN':'按键：${e.key}  |  代码：${e.code}  |  重复：${e.repeat ? "是":"否"}','ru':'клавиша: ${e.key}  |  код: ${e.code}  |  повтор: ${e.repeat ? "да":"нет"}'},
'${k} permission is blocked. Check browser permissions.': {'zh-CN':'${k} 权限被阻止。请检查浏览器权限。','ru':'Доступ к ${k} заблокирован. Проверьте разрешения браузера.'},
'${k} device is unavailable. Check whether another app is using it.': {'zh-CN':'${k} 设备不可用。请检查是否被其他应用占用。','ru':'Устройство ${k} недоступно. Проверьте, не используется ли оно другим приложением.'},
'No available ${k} device was found.': {'zh-CN':'未找到可用的 ${k} 设备。','ru':'Доступное устройство ${k} не найдено.'},
'Permission denial or device-access failure alone is not treated as hardware failure.': {'zh-CN':'仅权限被拒绝或设备访问失败，不会被直接判定为硬件故障。','ru':'Сам по себе отказ в разрешении или ошибка доступа не считается неисправностью оборудования.'},
'Camera stopped': {'zh-CN':'摄像头已停止','ru':'Камера остановлена'},
'Switching camera': {'zh-CN':'正在切换摄像头','ru':'Переключение камеры'},
'Current camera input is confirmed. Turn on the other camera once as well.': {'zh-CN':'当前摄像头输入已确认。请再打开另一个摄像头一次。','ru':'Текущий видеовход подтверждён. Включите также другую камеру.'},
'Distinct front and rear video inputs were confirmed, so basic camera function was automatically marked OK. Check lens smudges and color yourself.': {'zh-CN':'已确认前后摄像头为不同视频输入，因此基础摄像头功能已自动标记正常。镜头污渍和颜色请自行检查。','ru':'Подтверждены разные передний и задний видеовходы, поэтому базовая функция камеры автоматически отмечена как исправная. Загрязнение линзы и цвет оцените самостоятельно.'},
'Video input is connected, but this browser does not expose front/rear identity, so automatic OK judgment is withheld.': {'zh-CN':'视频输入已连接，但此浏览器未提供前后摄像头识别信息，因此暂不自动判定正常。','ru':'Видеовход подключён, но браузер не сообщает, какая камера передняя или задняя, поэтому автооценка не выполняется.'},
'Microphone stopped': {'zh-CN':'麦克风已停止','ru':'Микрофон остановлен'},
'Checking microphone input': {'zh-CN':'正在检测麦克风输入','ru':'Проверка входа микрофона'},
'Speak or clap. The result is judged automatically when input response is detected.': {'zh-CN':'说话或拍手。检测到输入响应后会自动判定。','ru':'Скажите что-нибудь или хлопните. Результат оценивается автоматически при обнаружении сигнала.'},
'A real input signal was detected, so basic microphone function was automatically marked OK.': {'zh-CN':'检测到真实输入信号，因此麦克风基础功能已自动标记正常。','ru':'Обнаружен реальный входной сигнал, поэтому базовая функция микрофона автоматически отмечена как исправная.'},
'Microphone input response detected': {'zh-CN':'已检测到麦克风输入响应','ru':'Обнаружен сигнал микрофона'},
'Full testable area + multi-touch confirmed · automatically marked OK': {'zh-CN':'可检测区域100% + 多点触控已确认 · 已自动标记正常','ru':'Вся тестовая область + мультитач подтверждены · автоматически отмечено как норма'},
'Full testable area complete · multi-touch still needs checking': {'zh-CN':'可检测区域已100%完成 · 仍需确认多点触控','ru':'Вся тестовая область пройдена · мультитач ещё нужно проверить'},
'The test closes automatically when the area below the top exit bar reaches 100%.': {'zh-CN':'顶部退出栏以下的检测区域达到100%后会自动关闭。','ru':'Тест автоматически закрывается при 100% покрытия области ниже верхней панели выхода.'},
'Test tone played · confirm yourself that it was actually audible.': {'zh-CN':'测试音已播放 · 请自行确认是否实际听到。','ru':'Тестовый сигнал воспроизведён · подтвердите, что вы действительно его слышали.'},
'The test tone could not be played in this browser.': {'zh-CN':'此浏览器无法播放测试音。','ru':'В этом браузере не удалось воспроизвести тестовый сигнал.'},
'This browser does not support the Vibration API. Lack of support is not a device defect.': {'zh-CN':'此浏览器不支持振动 API。浏览器不支持并不代表设备故障。','ru':'Этот браузер не поддерживает Vibration API. Отсутствие поддержки не означает неисправность устройства.'},
'This browser supports the Vibration API.': {'zh-CN':'此浏览器支持振动 API。','ru':'Этот браузер поддерживает Vibration API.'},
'Screen rotation detected. Confirm vibration by feel.': {'zh-CN':'已检测到屏幕旋转。请通过实际感受确认振动。','ru':'Поворот экрана обнаружен. Подтвердите вибрацию по ощущениям.'},
'Screen rotation was confirmed automatically. If you felt vibration, press OK.': {'zh-CN':'屏幕旋转已自动确认。如果感受到振动，请点击“正常”。','ru':'Поворот экрана подтверждён автоматически. Если вы почувствовали вибрацию, нажмите «Норма».'},
'Portrait': {'zh-CN':'竖屏','ru':'Портрет'},
'Landscape': {'zh-CN':'横屏','ru':'Альбом'},
}

def translate_text(text, lang):
    merged = {}
    merged.update(COMMON)
    merged.update(PHRASES)
    merged.update(JS_PHRASES)
    for src in sorted(merged, key=len, reverse=True):
        text = text.replace(src, merged[src][lang])
    return text


def page_suffix(page):
    return '' if page == 'index.html' else page


def locale_url(lang, page):
    if lang == 'ko':
        return BASE + page_suffix(page)
    return BASE + lang + '/' + page_suffix(page)


def add_global_links(text, page):
    if 'hreflang="zh-CN"' not in text:
        marker = '<link rel="alternate" hreflang="x-default"'
        ins = (f'<link rel="alternate" hreflang="zh-CN" href="{locale_url("zh-CN", page)}">'
               f'<link rel="alternate" hreflang="ru" href="{locale_url("ru", page)}">')
        text = text.replace(marker, ins + marker)
    if '<option value="zh-CN"' not in text:
        text = text.replace('</select>', '<option value="zh-CN">简体中文</option><option value="ru">Русский</option></select>', 1)
    return text


def create_locale(lang, html_lang, og_locale, option_value):
    src = DIST / 'en'
    dst = DIST / lang
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    for p in dst.glob('*'):
        if p.suffix not in {'.html','.js'}:
            continue
        text = p.read_text(encoding='utf-8')
        text = text.replace('<html lang="en">', f'<html lang="{html_lang}">')
        text = text.replace('content="en_US"', f'content="{og_locale}"')
        text = text.replace('"inLanguage":"en"', f'"inLanguage":"{html_lang}"')
        text = text.replace(BASE + 'en/', BASE + lang + '/')
        text = text.replace('<option value="en" selected>', '<option value="en">')
        if '<option value="zh-CN"' not in text:
            text = text.replace('</select>', '<option value="zh-CN">简体中文</option><option value="ru">Русский</option></select>', 1)
        text = text.replace(f'<option value="{option_value}">', f'<option value="{option_value}" selected>')
        text = translate_text(text, lang)
        if p.suffix == '.html':
            text = add_global_links(text, p.name)
        p.write_text(text, encoding='utf-8')

create_locale('zh-CN', 'zh-CN', 'zh_CN', 'zh-CN')
create_locale('ru', 'ru', 'ru_RU', 'ru')

for p in DIST.rglob('*.html'):
    page = p.name
    text = p.read_text(encoding='utf-8')
    text = add_global_links(text, page)
    p.write_text(text, encoding='utf-8')

robots = DIST / 'robots.txt'
robots.write_text(
    'User-agent: *\nAllow: /\n\n'
    'User-agent: Baiduspider\nAllow: /\n\n'
    'User-agent: Yandex\nAllow: /\n\n'
    f'Sitemap: {BASE}sitemap.xml\n', encoding='utf-8')

langs = ['ko','en','ja','es','de','fr','pt','it','nl','id','vi','zh-CN','ru']
urls = []
for lang in langs:
    for page in PAGES:
        urls.append(locale_url(lang, page))
body = ''.join(f'<url><loc>{u}</loc></url>' for u in urls)
(DIST/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+body+'</urlset>', encoding='utf-8')

print(f'Added zh-CN/ru and rebuilt sitemap: {len(urls)} URLs')
