const calcScreen = document.querySelector(".calc input");
const calcBtns = document.querySelectorAll(".calc button");

// вызов функции по клику на кнопку
for (let index = 0; index < calcBtns.length; index ++) {
   calcBtns[index].addEventListener("click", () => {addSymbol(calcBtns[index].innerHTML)}); // добавление на экран нового символа
   calcBtns[index].addEventListener("focus", () => {showSimbol()}); // показывать последний символ при добавлении нового
}

var lastSymbol = ''
var lastNumber = '';
var nullCount = 1; // сколько раз можно ввести 0
var dotLock = false; // счётчик точек

// добавляет символы на экран калькулятора
function addSymbol(symbol) {
   lastSymbol = calcScreen.value[calcScreen.value.length-1];

   // очищает строку, если в ответе не было числа
   if (calcScreen.value == Infinity || calcScreen.value == 'NaN') {
      calcScreen.value = '';
   }

   switch(symbol) {
      case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
         // если после % вводится цифра добавляет *
         if (lastSymbol == '%') {
            calcScreen.value += '×';
         }
         
         calcScreen.value += symbol;
         lastNumber += symbol
         nullCount = Infinity;
         break

      case '0':
         // если после % вводится цифра добавляет *
         if (lastSymbol == '%') {
            calcScreen.value += '×';
         }

         // проверяет сколько 0 можно ввести
         switch(nullCount) {
            case 1:
               nullCount = 0
            case Infinity:
               calcScreen.value += symbol;
         }

         lastNumber += symbol
         break
         
      case '+': case '–': case '×': case '÷': case '^': // вместо минуса символ тире!! [–  &ndash;  Alt + 0150] (маленький минус с этим шрифтом)
         nullReplace();
         // замена последнего знака при вводе нового (исключение - %)
         if (
            lastSymbol/lastSymbol != 1 &&
            lastSymbol != 0 &&
            lastSymbol != '%'
         ) {
            // если знак после корня, то корень заменяется (5√+ = 5+)
            // + защита он нескольких повторений (5√+√-√+ = 5+ / 5+0.+ = 5+0+)
            if (calcScreen.value[calcScreen.value.length-2]/calcScreen.value[calcScreen.value.length-2] != 1 && calcScreen.value[calcScreen.value.length-2] != 0) {
               calcScreen.value = calcScreen.value.slice(0, calcScreen.value.length-2)
            } else {
               calcScreen.value = calcScreen.value.slice(0, calcScreen.value.length-1)
            }
         }
         
         // не даёт создать знак в пустой строке (исключение - минус)
         if (calcScreen.value.length > 0) {
            calcScreen.value += symbol;
         } else if (symbol == '–') {
            calcScreen.value = '–';
         }
         nullCount = 1
         dotLock = false
         break

      case '.':
         // блокировка точки при повторных нажатиях (исключение - %)
         if (dotLock == false && lastSymbol != '%') {
            if (
               calcScreen.value.length > 0 &&
               (lastSymbol/lastSymbol == 1 || lastSymbol == 0)
            ) { 
               calcScreen.value += symbol;
            } else {
               calcScreen.value += '0.';
            }
            lastNumber += symbol
         }
         else if (lastSymbol == '%') {
            calcScreen.value += '×0.';
         }
         nullCount = Infinity
         dotLock = true
         break

      case '%':
         nullReplace();
         // добавляет '1', если нет числа слева
         if (lastSymbol/lastSymbol != 1 && lastSymbol != '%' && lastSymbol != '0') {
            calcScreen.value += '1';
         }
         calcScreen.value += symbol;
         nullCount = 1
         dotLock = false
         break

      case '√':
         nullReplace();
         // если последний символ √ - не повторяет его
         if (lastSymbol != '√') {
            calcScreen.value += symbol;
         }
         nullCount = 1;
         dotLock = false;
         break

      case '=':
         if (calcScreen.value != '') {
            nullReplace();
            // удаление лишних символов в конце
            if (lastSymbol/lastSymbol != 1 && lastSymbol != 0 && lastSymbol!= '%') {
               calcScreen.value = calcScreen.value.slice(0, calcScreen.value.length-1)
            }

            outputPrefix = calcScreen.value // выражение перед = (для вывода в истории)

            // финальное форматирование
            calcScreen.value = calcScreen.value.replaceAll('^', '**')
            calcScreen.value = calcScreen.value.replaceAll('×', '*')
            calcScreen.value = calcScreen.value.replaceAll('÷', '/')
            calcScreen.value = calcScreen.value.replaceAll('–', '-')

            calcSqrt(); // вычисление корней
            calcScreen.value = calcScreen.value.replaceAll(')Math', ')*Math') // √4√4 = Math.sqrt(4)*Math.sqrt(4)
            calcPercent(); // вычисление процентов

            // переводит строку в выражение и высчитывает результат
            calcScreen.value = eval(calcScreen.value);

            // обновление счётчика нулей
            if (calcScreen.value == 0) {
               nullCount = 0;
            } else {
               nullCount = Infinity;
            }

            calcScreen.value = calcScreen.value.replaceAll('-', '–') // для красивого отображения
            outputPostfix = calcScreen.value // ответ (для вывода в истории)

            // обновление счётчика точек
            if (calcScreen.value.indexOf('.') != -1) {
               dotLock = true;
            } else {
               dotLock = false;
            }

            // добавление в историю
            if (outputPrefix != outputPostfix) {
               LocalStorageAppend(outputPrefix + '=' + outputPostfix);
            }
         }
         break

      case 'C':
         calcScreen.value = '';
         nullCount = 1;
         dotLock = false;
         break
   }
}

function showSimbol() {
   calcScreen.focus();
   calcScreen.selectionStart = calcScreen.value.length;
}

// убирает лишние 0 введённые по ошибке после точки (15.0002000 = 15.0002)
function nullReplace() {
   if (lastNumber.indexOf('.') != -1) {
      let n = 0;
      let index = lastNumber.length-1;
      while (lastNumber[index] != '.' && lastNumber[index] == 0) {
         index = index-1
         n ++
      }
      if (n > 0) {
         calcScreen.value = calcScreen.value.slice(0, calcScreen.value.length-n)
         if (calcScreen.value[calcScreen.value.length-1] == '.') {
            calcScreen.value = calcScreen.value.slice(0, calcScreen.value.length-1)
         }
      }
   }
   lastNumber = '';
}

// высчитывает корни (√4 = Math.sqrt(4))
function calcSqrt() {
   while (calcScreen.value.indexOf('√') != -1) { // повторяет цикл, пока в выражении есть знак корня ( √ )
      var numSqrt = ''; // число под корнем
      var prefixSqrt = 'Math.sqrt('; // заменяет символ корня ( √ ), чтобы функция смогла прочитать выражение
      let index = calcScreen.value.indexOf('√');

      // проверка на числа перед знаком корня ( √ )
      if (
         calcScreen.value[index-1]/calcScreen.value[index-1] == 1 ||
         calcScreen.value[index-1] == 0 ||
         calcScreen.value[index-1] == '.'
      ) {
         prefixSqrt = '*' + prefixSqrt;
      }

      // находит число под корнем (numSqrt)
      while (
         calcScreen.value[index+1]/calcScreen.value[index+1] == 1 ||
         calcScreen.value[index+1] == 0 ||
         calcScreen.value[index+1] == '.'
      ) {
         numSqrt += calcScreen.value[index+1]
         index ++
      }
      if (calcScreen.value[index+1] == '%') {
         numSqrt += '%'
      }
      calcScreen.value = calcScreen.value.replace('√' + numSqrt, prefixSqrt + numSqrt + ')');
   }
}

// высчитывает проценты
function calcPercent() {
   while (calcScreen.value.indexOf('%') != -1) { // повторяет цикл, пока в выражении есть знак процента ( % )
      var numPercent = ''; // число перед знаком
      var colPercent = ''; // кол-во процентов
      var percent = '0.01' // один процент
      let index = calcScreen.value.indexOf('%');
      
      // находит кол-во процентов
      while (
         calcScreen.value[index-1]/calcScreen.value[index-1] == 1 ||
         calcScreen.value[index-1] == 0 ||
         calcScreen.value[index-1] == '.'
      ) {
         colPercent = calcScreen.value[index-1] + colPercent;
         index = index-1;
      }

      key = calcScreen.value[index-1] // знак перед кол-вом процентов
      keyIndex = index-1;
      
      if ( // если знак '+' или '–' меняется значение одного процента (percent)
         key == '+' ||
         key == '–'
      ) {
         // находит число перед знаком (numPercent)
         while (
            calcScreen.value[index-2]/calcScreen.value[index-2] == 1 ||
            calcScreen.value[index-2] == 0 ||
            calcScreen.value[index-2] == '.'
         ) {
            numPercent = calcScreen.value[index-2] + numPercent;
            index = index-1;
         }
         percent =  percent * colPercent
         calcScreen.value = calcScreen.value.replace(numPercent + key + colPercent + '%', numPercent + key + numPercent * percent)
      } else if (calcScreen.value.slice(keyIndex-9,keyIndex+1) == 'Math.sqrt(' ) { // если находится в корне
         if (colPercent == '') { // если нет цифр перед знаком процента
            calcScreen.value = calcScreen.value.replace(colPercent + '%', percent)
         } else {
            calcScreen.value = calcScreen.value.replace(colPercent + '%', colPercent * percent)
         }
      } else if (key == '^' || key == undefined) { // если справа | возведение в степень / пусто |
         calcScreen.value = calcScreen.value.replace(colPercent + '%', colPercent * percent)
      } else {
         calcScreen.value = calcScreen.value.replace(colPercent + '%', colPercent + key + percent)
      }
   }
}

// первое посещение страницы
var visited = 'false';
try {
	visited = localStorage.getItem('visit');
} catch {}

// проверка статуса посещения страницы
if (visited == 'true') {
	arrStorage = localStorage.getItem('arr');
	arr = [];
	let index1 = 0;
	for (let index = 0; index < arrStorage.length; index ++) {
		if (arrStorage[index] == ',') {
			arr.push(arrStorage.slice(index1,index));
			index1 = index+1;
		}
		else if (index == arrStorage.length-1) {
			arr.push(arrStorage.slice(index1,arrStorage.length));
		}
	}
	localStorage.setItem('arr', arr);
} else {
	localStorage.setItem('visit', 'true');
	var arr = [];
	localStorage.setItem('arr', arr);
}

LocalStorageInit()
function LocalStorageInit() {
	const StorageClear = document.querySelectorAll('.storage li');
	for (let index = 0; index < StorageClear.length; index ++) {
		StorageClear[index].remove();
	}
	while (arr.length > 100) {
		arr.shift();
	}
	for (let index = 0; index < arr.length; index ++) {
		const storage__items = document.querySelector('.storage ul');    
		const li = document.createElement('li');
		li.textContent = arr[index];
		li.appendChild(document.createElement('div'));
		storage__items.prepend(li);
	}
}

function LocalStorageAppend(Append) {
	arr.push(Append);
	while (arr.length > 100) {
		arr.shift();
	}
	localStorage.setItem('arr', arr);
	LocalStorageInit();
}

// localStorage.clear()