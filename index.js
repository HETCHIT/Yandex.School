class ObjectWithValidation {
    constructor(nameForm) {
        this._form = document.querySelector(`form[name="${nameForm}"]`);
        this._action = this._form.action;
        this._fields = this._form.querySelectorAll('input[name]');
        this._btn = document.getElementById('submitButton');
        this._result = document.getElementById('resultContainer');

        this.fio = null;
        this.email = null;
        this.phone = null;
    }

    bindEvents() {
        let self = this;

        this._btn.addEventListener('click', function (event) {
            event.preventDefault();
            self.submit();
        });

        function toPhoneFormat(elem) {
            let v = elem.value;
            if (v !== null) {
                let clear = v.toString().replace(new RegExp('[^0-9]', 'g'), ''),
                    s1 = clear.substr(0, 1),
                    s2 = clear.substr(1, 3),
                    s3 = clear.substr(4, 3),
                    s4 = clear.substr(7, 2),
                    s5 = clear.substr(9, 2),
                    formatted = '';
                if (s1) {
                    if (s1 != 7) s1 = 7;
                    formatted += '+' + s1;
                }
                if (s2) {
                    formatted += '(' + s2;
                }
                if (s3) {
                    formatted += ')' + s3;
                }
                if (s4) {
                    formatted += '-' + s4;
                }
                if (s5) {
                    formatted += '-' + s5;
                }
                if (v !== formatted) {
                    elem.value = formatted;
                }
            }
        }

        let phoneField = this._form.querySelector('input[name="phone"]');
        phoneField.addEventListener('keydown', function (event) {
            let tmp = this;
            setTimeout(function () {
                toPhoneFormat(tmp);
            }, 50);
        });
        phoneField.addEventListener('change', function (event) {
            toPhoneFormat(this);
        });
        phoneField.addEventListener('paste', function (event) {
            let tmp = this;
            setTimeout(function () {
                toPhoneFormat(tmp);
            }, 100);
        });
    }

    getData() {
        let result = {};

        for (let i = 0; i < this._fields.length; i++) {
            let field = this._fields[i],
                name = field.name;

            result[name] = field.value;
        }

        return result;
    }

    setData(data) {
        for (let field in data) {
            if (data.hasOwnProperty(field)) {
                this._form.querySelector(`input[name="${field}"]`).value = data[field];
            }
        }
    }

    fioValidator() {
        let v = this.getData().fio;
        return v !== null && v.toString().trim().replace(/\s\s+/g, ' ').split(' ').length === 3;
    }

    emailValidator() {
        let v = this.getData().email,
            isValid = false,
            domains = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];
        if (v !== null) {
            v = v.toString().trim();
            let isGood = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v);  //honestly taken from Internet
            if (isGood) {
                v = v.split('@');
                let username = v[0],
                    domain = v[1];

                if (!!~domains.indexOf(domain)) {
                    isValid = true;
                }
            }

        }
        return isValid;
    }

    phoneValidator() {
        let v = this.getData().phone,
            isValid = false;
        if (v !== null) {
            let l = v.length,
                clear = v.toString().replace(new RegExp('[^0-9]', 'g'), ''),
                clearL = clear.length,
                sum = 0;
            for (let i = 0; i < clearL; i++) {
                sum += parseInt(clear[i]);
            }

            isValid = l === 16 && sum <= 30;
        }
        return isValid;
    }

    validate() {
        let result = {
            isValid: true,
            errorFields: []
        };

        for (let i = 0; i < this._fields.length; i++) {
            let field = this._fields[i],
                name = field.name.toLowerCase(),
                fn = this[`${name}Validator`];

            field.className = field.className.replace('error', '').trim();

            if (typeof fn === 'function') {
                let isValid = fn.call(this);
                if (!isValid) {
                    field.className += ' error';
                    result.isValid = false;
                    result.errorFields.push(name);
                }
            }
        }

        return result;
    }

    submit() {
        let self = this;

        let isValid = this.validate().isValid,
            btn = this._btn,
            res = this._result;

        res.innerText = '';
        res.className = res.className
            .replace('success', '')
            .replace('error', '')
            .replace('progress', '')
            .trim();

        if (isValid) {
            btn.disabled = true;

            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    btn.disabled = false;
                    if (xhr.status === 200) {
                        let response = xhr.response;
                        try {
                            response = JSON.parse(response);
                            switch (response.status) {
                                case 'success':
                                    res.innerText = 'Success';
                                    res.className += ' success';
                                    break;
                                case 'error':
                                    res.innerText = response.reason;
                                    res.className += ' error';
                                    break;
                                case 'progress':
                                    res.innerText = 'Progress';
                                    res.className += ' progress';
                                    setTimeout(function () {
                                        self.submit();
                                    }, response.timeout);
                                    break;
                            }

                        } catch (e) {
                            console.error('Error: %s', e.message);
                        }
                    } else {
                        console.error('Error');
                    }
                }
            };
            xhr.open('post', this._action, true);
            xhr.send(this.getData());
        }
    }
}

let MyForm = undefined;

document.addEventListener('DOMContentLoaded', function () {
    MyForm = new ObjectWithValidation('myForm');
    MyForm.bindEvents();

    MyForm.setData({
        fio: 'User Name Surname',
        email: 'example@ya.ru',
        phone: '+7(111)111-11-11'
    })
}, false);