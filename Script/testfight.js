/*
    本作品用于QuantumultX和Surge之间js执行方法的转换
    您只需书写其中任一软件的js,然后在您的js最【前面】追加上此段js即可
    无需担心影响执行问题,具体原理是将QX和Surge的方法转换为互相可调用的方法
    尚未测试是否支持import的方式进行使用,因此暂未export
    如有问题或您有更好的改进方案,请前往 https://github.com/sazs34/TaskConfig/issues 提交内容,或直接进行pull request
    您也可直接在tg中联系@wechatu
*/
// #region 固定头部
let isQuantumultX = $task !== undefined; //判断当前运行环境是否是qx
let isSurge = $httpClient !== undefined; //判断当前运行环境是否是surge
// http请求
var $task = isQuantumultX ? $task : {};
var $httpClient = isSurge ? $httpClient : {};
// cookie读写
var $prefs = isQuantumultX ? $prefs : {};
var $persistentStore = isSurge ? $persistentStore : {};
// 消息通知
var $notify = isQuantumultX ? $notify : {};
var $notification = isSurge ? $notification : {};
// #endregion 固定头部

// #region 网络请求专用转换
if (isQuantumultX) {
    var errorInfo = {
        error: ''
    };
    $httpClient = {
        get: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        },
        post: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            url.method = 'POST';
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        }
    }
}
if (isSurge) {
    $task = {
        fetch: url => {
            //为了兼容qx中fetch的写法,所以永不reject
            return new Promise((resolve, reject) => {
                if (url.method == 'POST') {
                    $httpClient.post(url, (error, response, data) => {
                        response.body = data;
                        resolve(response, {
                            error: error
                        });
                    })
                } else {
                    $httpClient.get(url, (error, response, data) => {
                        response.body = data;
                        resolve(response, {
                            error: error
                        });
                    })
                }
            })

        }
    }
}
// #endregion 网络请求专用转换

// #region cookie操作
if (isQuantumultX) {
    $persistentStore = {
        read: key => {
            return $prefs.valueForKey(key);
        },
        write: (val, key) => {
            return $prefs.setValueForKey(val, key);
        }
    }
}
if (isSurge) {
    $prefs = {
        valueForKey: key => {
            return $persistentStore.read(key);
        },
        setValueForKey: (val, key) => {
            return $persistentStore.write(val, key);
        }
    }
}
// #endregion

// #region 消息通知
if (isQuantumultX) {
    $notification = {
        post: (title, subTitle, detail) => {
            $notify(title, subTitle, detail);
        }
    }
}
if (isSurge) {
    $notify = function (title, subTitle, detail) {
        $notification.post(title, subTitle, detail);
    }
}
/**
 * 
 * 写入要监测的公测tf appkey，当有空位的时候会弹出通知。
 * 建议task时间间隔小点。
 */

const title = 'testfilght';
const url = "https://testflight.apple.com/join/";

//填入要监测的appkey。从testfligt地址获取。
const appkey = "VCIvwk2g,VCIvwk2g,SHQFznkM,oV5HiCSz";
const fullstr = 'This beta is full';
const appnamereg = /<span>请在 iPhone 或 iPad 中安装 TestFlight 以加入 Beta 版"(.+)"测试。<\/span>/;
var proarray = new Array();
getResult();

function getResult() {
    var upstr = '已有空位，抓紧上车';
    var apps = new Array(); //定义一数组
    apps = appkey.split(","); //字符分割
    var resultstr = '';


    console.log(apps.length);
    for (var i = 0; i < apps.length; i++) {
        var lol = {
            url: url + apps[i],
            headers: {
                'User-Agent': '[{"key":"User-Agent","value":" Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2357.130 Safari/537.36 qblink wegame.exe QBCore/3.70.66.400 QQBrowser/9.0.2524.400","type":"text","enabled":true,"description":""},{"key":"X-Requested-With","value":" XMLHttpRequest","type":"text","enabled":false,"description":""}]',
            },
        };
        console.log(i+'begin');
        var p = new Promise(function (resolve) {
        $httpClient.get(lol, function (error, response, data) {
            console.log(data.indexOf(fullstr));
            try{
          
            if (data.indexOf(fullstr) == -1) {
                appnamereg.test(data);
                var appname = appnamereg.exec(data);
                if (!appname != null) {
                    var reg = /".+"/
                    var item = reg.exec(appname[0]);
                    var name=item[0].replace('"', '').replace('"', '');
                    resultstr = resultstr + '[' + name + ']' + upstr + '👉:' + lol.url + '\n'
                }
            }
            resolve('done');
        }
        catch(errr){
            resolve('done');
        }
         
        });
            });

           
        proarray[i] = p;
    }
    Promise.all(proarray).then((result) => {
        if(resultstr==''){
            $notification.post(title, '', '暂无车位');
        }
        else{
        $notification.post(title, '', resultstr);
        }
    }).catch((error) => {
        console.log(error)
    });


}