const SetNameDecorator = (firstName: string, lastName: string) => {
    const name = `${firstName}.${lastName}`;
    return <T extends new (...args: any[]) => any>(target: T) => {
        return class extends target {
            _name: string = name;

            getMyName() {
                return this._name;
            }
        };
    };
};

@SetNameDecorator('ray', 'liuyi')
class UserService {
    [key: string]: any;

    c() {}
}

export const exp3 = () => {
    console.log();
    console.log('-----------------------示例3:装饰器工厂-----------------------');
    console.log('-----------------------通过继承方式 重载getName方法-----------------------');
    console.log();
    const user = new UserService();
    console.log(user.getMyName());
    console.log();
    console.log('-----------------------示例3:执行完毕-----------------------');
};
