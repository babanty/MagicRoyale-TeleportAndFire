const pathLib = require('path'); // подключаем библиотеку для работы с путями
const HtmlWebpackPlugin = require('html-webpack-plugin'); // подключаем плагин для работы с html-ем
const {CleanWebpackPlugin} = require('clean-webpack-plugin'); // подключаем плагин, который очищает выходную папку прежде чем в нее собрать новый билд
const CopyWebpackPlugin = require('copy-webpack-plugin'); // подключаем плагин, который позволяет указывать файлы (например, картинки), которые надо копировать в выходной каталог.

module.exports = {
    mode: 'development', // (альтернатива production) - как собирать, если выбран прод, то минифицируется
    entry: {  // входные файлы для нашего приложения
        main: './src/index.js'
    },

    output: {
        filename: '[name].[contenthash].js', // файлы, в которые соберутся файлы из entry. Тут используется шаблоны:
                      // [name] - имя из блока entry
                      // [contenthash] - это генерируемое имя, чтобы браузер людей при выходе новой версии удалял их кеша старый файл
        path: pathLib.resolve(__dirname, 'ui_artefacts') // папка куда будет все собираться
    },
    plugins: [  // список всех плагинов что добавляем к webpack-у
        new HtmlWebpackPlugin({ // этот плагин тащит html в выходной каталог
            template: './src/index.html' // указываем какой html- файл должен быть переварен в выходной каталог
        }),
        new CopyWebpackPlugin([ // указывает какие файлы куда копировать при билде, например картинки или левые js-файлы в выходной каталог
            {
                from: pathLib.resolve(__dirname, 'src/images'),
                to: pathLib.resolve(__dirname, 'ui_artefacts/images')
            }
        ]),
        new CleanWebpackPlugin() // этот плагин, очищает выходную папку прежде чем в нее собрать новый билд
    ],
    module: { // подключаем модули-loader-ы, которые могут заимпортить в js, например css-стили
        rules: [
            {
                test: /\.css$/,  // тут регулярками мы задаем файлы, которые будем "load-ить",
                use: ['style-loader','css-loader'] // указываем какой loader использовать.
                                                   // webpack пропускает справа налево, то есть сперва он будет использовать css-loader
                                                   // style-loader добавляет в секцию head в html css-стили
            }
        ]
    },
    devServer: { // это про вот эту команду (см. mindmap): npm install -D webpack-dev-server
        port: 4999 // порт на котором стартуется приложение если используется webpackServer (npm run devServer)
    } 
}