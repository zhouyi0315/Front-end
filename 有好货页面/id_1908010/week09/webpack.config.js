module.exports = {
    entry: "./test.js",
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                      presets: ['@babel/preset-env'],
                      plugins: [['babel-plugin-transform-react-jsx', {pragma:"create"}]]
                    }
                }
            },
            {
                test: /\.element$/,
                use: {
                    loader: require.resolve('./component-loader.js')
                }
            }
        ]
    },
    mode: 'development',
    devServer: {
        contentBase: './dist',
        hot: true
    },
    optimization: {
        minimize: false
    }
}