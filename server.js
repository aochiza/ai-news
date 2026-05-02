const express = require('express'); //веб-фреймворк для создания сервера
const path = require('path'); //модуль для работы с путями
const app = express(); //создаем экземпляр express
const PORT = 3000; //порт для сервера

app.use(express.static(__dirname)); //используем express.static для сервера чтобы сервер мог отдавать статические файлы

app.get('*', (req, res) => { //обработчик запросов
  res.sendFile(path.join(__dirname, 'index.html')); //отправляем файл 
});

app.listen(PORT, () => { //запускаем сервер
  console.log(`Сервер запущен на http://localhost:${PORT}`); //вывод сообщ в консоль
});