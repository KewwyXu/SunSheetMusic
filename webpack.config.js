import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
   mode: 'development',
   entry: './src/index.tsx',
   output: {
      filename: '[name].[contenthash].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
   },
   cache: {
      type: 'filesystem', // 使用文件系统缓存，加速构建
   },
   devtool: 'inline-source-map',
   devServer: {
      liveReload: true,
      hot: true,
   },
   module: {
      rules: [
         {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader', 'postcss-loader'],
         },
         {
            test: /\.(png|svg|jpg|jpeg|gif)$/i,
            type: 'asset/resource',
         },
         {
            test: /\.(woff|woff2|eot|ttf|otf)$/i,
            type: 'asset/resource',
         },
         {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
         },
      ],
   },
   resolve: {
      extensions: ['.tsx', '.ts', '.js', '.html', '.css'],
   },
   optimization: {
      splitChunks: {
         chunks: 'all', // 启用代码分割
         cacheGroups: {
            vendor: {
               test: /[\\/]node_modules[\\/]/,
               name: 'vendors',
               chunks: 'all',
            },
         },
      },
   },
   plugins: [
      new HtmlWebpackPlugin({
         title: '美阳阳钢琴',
         template: './index.html',
      }),
      // new BundleAnalyzerPlugin(),
   ],
};
