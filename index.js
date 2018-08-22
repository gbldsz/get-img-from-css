const fs = require('fs')
const path = require('path');
const http = require('http');

function getImgFromCss() {}
getImgFromCss.prototype = {
    //配置
    options: {
        path: '', //样式路径   只接受线上链接或者 绝对路径
        savePath: '' //保存图片路径 只接受本地绝对路径
    },
    //线上样式
    getHttpCss: function () {
        let _this = this;
        //获取线上样式
        http.get(this.options.path, (res) => {
            let cssData = ''
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                cssData += chunk;
            });
            res.on("end", function () {
                let imgs = _this.searchImg(cssData);
                imgs.map(imgUrl => {
                    //获取线上图片
                    http.get(imgUrl, (res) => {
                        let imgData = '';
                        res.setEncoding("binary");
                        res.on("data", function (chunk) {
                            imgData += chunk;
                        });
                        res.on("end", function () {
                            _this.saveImg(imgUrl,imgData);
                        });
                    })
                })
                
            });
        })
    },
    //本地样式
    getLocalCss: function () {
        //读取本地样式
        let _this = this;
        fs.readFile(this.options.path, 'utf8', (err, data) => {
            let imgs = this.searchImg(data)
            imgs.map((img) => {
                fs.readFile(img, (err, ig) => {
                    _this.saveImg(img, ig);
                })
            })
        })
    },
    //保存图片
    saveImg: function (img,ig) {
        let saveUrl = path.join(this.options.savePath, path.basename(img));
        fs.writeFile(saveUrl, ig, "binary", function (err) {
            if (err) {
                console.log(err);
            }
            console.log("down success");
        });
    },
    //搜索样式内所有背景图,返回图片路径列表
    searchImg: function (content) {
        let img = []
        let p = new RegExp(/background.*url\(([^\)]*)/, "g");
        let res;
        //循环匹配图片路径
        while ((res = p.exec(content)) != null) {
            let r = res[1].replace(/[\'\"]/g, '');
            let pathObj = path.parse(this.options.path)
            //合并路径并且替换http的单斜杠，和过滤版本信息
            let s = path.join(pathObj.dir, r).replace(/^http:\\/,'http://').replace(/\?(.)*$/);
            img.push(s);
        }
        return img;
    },
    //获取css里面图片
    get: function (params) {
        //初始化配置
        this.options.path = params.path || this.options.path;
        this.options.savePath = params.savePath || this.options.savePath;

        //判断样式是线上样式还是本地样式
        if (/^http/.test(this.options.path)) {
            this.getHttpCss();
        } else {
            this.getLocalCss();
        }
    }
}

module.exports = getImgFromCss;