import { Api } from './lib.js';

const baseURL = 'https://foxslot-vs-posts.herokuapp.com';
const api = new Api(baseURL);

const rootEl = document.getElementById('root');

let posts = [];

let lastSeenID = 0;
let newPostsId = 0;
const numberPosts = 5;

//форма добавления поста
const addFormEl = document.createElement('form');
rootEl.appendChild(addFormEl);

const groupForm = addElement('div', 'form-row', addFormEl);
const groupInput = addElement('div', 'form-group col-md-7', groupForm);
const groupSelectButton = addElement('div', 'form-group col-md-3', groupForm);
const groupButton = addElement('div', 'form-group col-md-2', groupForm);

const inputEl = addElement('input', 'form-control my-2 mr-sm-2', groupInput);
inputEl.placeholder = 'Введите ссылку';
inputEl.setAttribute('data-id', 'link');

const selectEl = addElement('select', 'custom-select my-2 mr-sm-2', groupSelectButton);
selectEl.setAttribute('data-id', 'type');

//добавление элементов выбора
const options = ['regular', 'image', 'audio', 'video'];
addOptions(selectEl, options);

const addEl = addElement('button', 'btn btn-primary my-2 mr-sm-2', groupButton);
addEl.textContent = 'Добавить';

const linkEl = addFormEl.querySelector('[data-id=link]');
const typeEl = addFormEl.querySelector('[data-id=type]');

addFormEl.onsubmit = function (ev) {
    ev.preventDefault();

    const data = {
        typeContent: typeEl.value,
        linkContent: linkEl.value,
        id: 0,
        content: linkEl.value,
    };

    api.postJSON('/posts', data, addNewPost, sendError);

    linkEl.value = '';
    typeEl.value = 'regular';
    labelLoadFile.textContent = 'Добавление поста с файлом. После выбора, файл будет загружен на сервер и ссылка на него автоматически подставлена в поле ввода ссылки на ресурс';

    //очистка области видео
    containerVideoEl.innerHTML = '';
    infoVideoEl.textContent = 'После записи видео, ссылка на него будет автоматически добавлена в поле ввода формы для создания поста';

};

//форма для добавления файла
const formLoadFileEl = document.createElement('form');
rootEl.appendChild(formLoadFileEl);
formLoadFileEl.id = 'simple';
formLoadFileEl.action = 'http://localhost:9999/upload';
formLoadFileEl.method = 'POST';
formLoadFileEl.enctype = 'multipart/form-data';

const groupFormLoadFile = addElement('div', 'form-group', formLoadFileEl);
const labelLoadFile = document.createElement('label');
groupFormLoadFile.appendChild(labelLoadFile);
labelLoadFile.for = 'exampleFormControlFile1';
labelLoadFile.textContent = 'Добавление поста с файлом. После выбора, файл будет загружен на сервер и ссылка на него автоматически подставлена в поле ввода ссылки на ресурс';

const inputLoadFile = addElement('input', 'form-control-file', groupFormLoadFile);
inputLoadFile.type = 'file';
inputLoadFile.name = 'media';

const mediaEl = document.querySelector('input[name=media]');
mediaEl.addEventListener('change', ev => {
    ev.preventDefault();
    const [first] = Array.from(ev.currentTarget.files);
    const formData = new FormData();
    formData.append('media', first);
    addEl.disabled = true;
    labelLoadFile.textContent = 'Загрузка файла...';
    fetch(`${baseURL}/upload`, {
        method: 'POST',
        body: formData,
    }).then(resp => {
        if (!resp.ok) {
            throw new Error(resp.statusText);
        }
        return resp.json();
    }).then(data => {
        const fileUrl = `${baseURL}/static/${data.name}`;
        inputEl.value = fileUrl;
        labelLoadFile.textContent = 'Файл загружен'
    }).catch(e => {
        console.log(e);
        labelLoadFile.textContent = `Ошибка! Файл не загружен.${e}`;
    }).finally(() => {
        addEl.disabled = false;
    });
    ev.currentTarget.value = '';
});


//кнопка записи видео
const addVideoEl = addElement('button', 'btn btn-primary my-2 mr-sm-2', formLoadFileEl);
addVideoEl.textContent = 'Добавить видео';

//<p class="card-text"
const infoVideoEl = addElement('p', 'card-text', formLoadFileEl);
infoVideoEl.textContent = 'После записи видео, ссылка на него будет автоматически добавлена в поле ввода формы для создания поста';


//хранилище для хранения видео
const containerVideoEl = document.createElement('div');
formLoadFileEl.appendChild(containerVideoEl);


addVideoEl.addEventListener('click', e => {

    e.preventDefault();
    containerVideoEl.innerHTML = '';

    if (!navigator.mediaDevices) { // !undefined -> true
        // alert('...');
        const alertEl = document.createElement('div');
        alertEl.textContent = 'Your browser not support media! Use Yande Browser.';
        document.body.appendChild(alertEl);
        return;
    }

    const outputVideoEl = document.createElement('video');
    outputVideoEl.id = 'output';
    outputVideoEl.width = '400';
    outputVideoEl.height = '300';
    containerVideoEl.appendChild(outputVideoEl);

    if (!window.MediaRecorder) {
        const alertEl = document.createElement('div');
        alertEl.textContent = 'Your browser not media recordering! Use Yande Browser.';
        document.body.appendChild(alertEl);
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {

            const mediaRecorder = new MediaRecorder(stream, {
                mediaType: 'video/webm', // MIME TYPE
            });

            const blobParts = []; // для хранения "кусков" записанного контента

            mediaRecorder.addEventListener('dataavailable', ev => {
                blobParts.push(ev.data);
            });

            mediaRecorder.addEventListener('stop', ev => {
                stream.getTracks().forEach(o => o.stop());
                const blob = new Blob(blobParts);
                outputVideoEl.srcObject = null;

                const formData = new FormData();
                formData.append('media', blob);

                fetch(`${baseURL}/upload`, {
                    method: 'POST',
                    body: formData,
                }).then(res => {
                    if (!res.ok) {
                        throw new Error(res.statusText);
                    }
                    return res.json();
                }).then(data => {
                    const videoURL = `${baseURL}/static/${data.name}`;
                    outputVideoEl.src = videoURL;
                    outputVideoEl.controls = true;
                    outputVideoEl.muted = true;
                    outputVideoEl.play();
                    infoVideoEl.textContent = 'Видео записано, ссылка установлена';

                    inputEl.value = videoURL;

                }).catch(e => {
                    console.log(e);
                });
            });

            mediaRecorder.start();
            outputVideoEl.srcObject = stream;
            outputVideoEl.muted = true;
            outputVideoEl.controls = false;
            outputVideoEl.play();
            infoVideoEl.textContent = 'Идет запись видео...'

            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);

        }).catch(e => {
            console.log(e);
        });

});

//кнопка загрузки постов
const buttonLoadNewPosts = addElement('button', 'btn btn-primary d-block mx-auto mt-2', rootEl);
buttonLoadNewPosts.textContent = 'Загрузить новые посты';
buttonLoadNewPosts.setAttribute('data-id', 'load-new-posts-button');
buttonLoadNewPosts.addEventListener('click', loadNewPosts);
buttonLoadNewPosts.classList.toggle('button-invisibility');


const postsEl = addElement('ul', 'list-group', rootEl);

const addPostsEl = addElement('button', 'btn btn-primary d-block mx-auto mt-2', rootEl);
addPostsEl.textContent = 'Загрузить еще';
addPostsEl.setAttribute('data-id', 'load-more-button');
addPostsEl.addEventListener('click', loadPosts);
rootEl.removeChild(addPostsEl);

function loadPosts() {

    fetch(`${baseURL}/posts/${lastSeenID}/${numberPosts}`).then(
        res => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }
            return res.json();
        }
    ).then(
        data => {
            if (data.length >= numberPosts) {
                addPosts(data);
                rootEl.appendChild(addPostsEl);
            } else if (data.length === 0) {
                const buttonLoadEl = rootEl.querySelector('[data-id=load-more-button]');
                rootEl.removeChild(buttonLoadEl);
            } else {
                addPosts(data);
                const buttonLoadEl = rootEl.querySelector('[data-id=load-more-button]');
                rootEl.removeChild(buttonLoadEl);
            };
            setCheckNewPosts();

        }
    ).catch(error => {
        console.log(error);
    });

};

function addPosts(items) {

    for (const item of items) {

        if (!findIndexById(item.id) === -1) {
            updatePostFromID(item.id);
        } else {

            //создание карточки
            const postEl = addElement('div', 'card my-2 mr-sm-2', postsEl);
            postEl.setAttribute('data-post-id', `${item.id}`);
            let captionPost = '';

            if (item.typeContent === 'regular') {

                //cоздание обычного поста
                const textEl = addElement('h5', 'card-text ml-3', postEl);
                textEl.textContent = item.linkContent;

                captionPost = 'Пост с текстом';

            } else if (item.typeContent === 'image') {

                //создание поста с изображением
                const imgEl = addElement('img', 'card-img-top', postEl);
                imgEl.src = item.linkContent;

                captionPost = 'Пост с изображением';

            } else if (item.typeContent === 'audio') {

                //создание поста с аудио
                const audioScr = addElement('audio', 'card-img-top', postEl);
                audioScr.src = item.linkContent;
                audioScr.controls = true;

                captionPost = 'Пост с аудио';

            } else if (item.typeContent === 'video') {

                //создание поста с видео
                const videoScr = addElement('video', 'embed-responsive-item', postEl);
                videoScr.src = item.linkContent;
                videoScr.controls = true;

                captionPost = 'Пост с видео';

            } else {

                // пост со спамом
                const textEl = addElement('p', 'card-text', postEl);
                textEl.textContent = 'Спам';

                captionPost = 'Пост со спамом';

            };

            //область под контентом
            const postBodyEl = addElement('div', 'card-body', postEl);

            //подпись под контентом
            const postContentEl = addElement('p', 'card-text', postBodyEl);
            postContentEl.textContent = captionPost;

            //лайки
            const likesEl = addElement('button', 'btn btn-primary', postBodyEl);
            likesEl.textContent = '❤ ' + item.likes;
            likesEl.setAttribute('data-id', 'button-like');
            likesEl.onclick = function () {
                api.postJSON(`/posts/${item.id}/likes`, null, updatePost, sendError);
            };

            //дизлайки как уменьшение лайков
            const dislikesEl = addElement('button', 'btn btn-primary ml-2', postBodyEl);
            dislikesEl.textContent = '👎';
            dislikesEl.onclick = function () {
                api.deleteJSON(`/posts/${item.id}/likes`, null, updatePost, sendError);
            };

            posts.unshift(item);

        };

    };

    posts.sort((a, b) => { return b.id - a.id });
    lastSeenID = posts[posts.length - 1].id;
    newPostsId = posts[0].id + 1;

};

function rebuildLists() {

    posts.sort((a, b) => { return b.id - a.id });

    postsEl.innerHTML = '';

    for (const item of posts) {

        //создание карточки
        const postEl = addElement('div', 'card my-2 mr-sm-2', postsEl);
        postEl.setAttribute('data-post-id', `${item.id}`);
        let captionPost = '';

        if (item.typeContent === 'regular') {

            //cоздание обычного поста
            const textEl = addElement('h5', 'card-text ml-3', postEl);
            textEl.textContent = item.linkContent;

            captionPost = 'Пост с текстом';

        } else if (item.typeContent === 'image') {

            //создание поста с изображением
            const imgEl = addElement('img', 'card-img-top', postEl);
            imgEl.src = item.linkContent;

            captionPost = 'Пост с изображением';

        } else if (item.typeContent === 'audio') {

            //создание поста с аудио
            const audioScr = addElement('audio', 'card-img-top', postEl);
            audioScr.src = item.linkContent;
            audioScr.controls = true;

            captionPost = 'Пост с аудио';

        } else if (item.typeContent === 'video') {

            //создание поста с видео
            const videoScr = addElement('video', 'embed-responsive-item', postEl);
            videoScr.src = item.linkContent;
            videoScr.controls = true;

            captionPost = 'Пост с видео';

        } else {

            // пост со спамом
            const textEl = addElement('p', 'card-text', postEl);
            textEl.textContent = 'Спам';

            captionPost = 'Пост со спамом';

        };

        //область под контентом
        const postBodyEl = addElement('div', 'card-body', postEl);

        //подпись под контентом
        const postContentEl = addElement('p', 'card-text', postBodyEl);
        postContentEl.textContent = captionPost;

        //лайки
        const likesEl = addElement('button', 'btn btn-primary', postBodyEl);
        likesEl.textContent = '❤ ' + item.likes;
        likesEl.setAttribute('data-id', 'button-like');
        likesEl.onclick = function () {
            api.postJSON(`/posts/${item.id}/likes`, null, updatePost, sendError);
        };

        //дизлайки как уменьшение лайков
        const dislikesEl = addElement('button', 'btn btn-primary ml-2', postBodyEl);
        dislikesEl.textContent = '👎';
        dislikesEl.onclick = function () {
            api.deleteJSON(`/posts/${item.id}/likes`, null, updatePost, sendError);
        };

    };

};

//функция добавления элементов по имени тега, 
function addElement(tagNameEl, classNameEl, parrentElementEl) {

    const itemEl = document.createElement(tagNameEl);
    itemEl.className = classNameEl;
    parrentElementEl.appendChild(itemEl);

    return itemEl;

};

//функция добавления элементов выбора через массив со значениями
function addOptions(selectEl, namesOptions) {

    for (const optionItem of namesOptions) {
        const optEl = document.createElement('option');
        optEl.value = optionItem;
        if (optEl.value === 'regular') {
            optEl.textContent = 'Обычный';
        } else if (optEl.value === 'image') {
            optEl.textContent = 'Изображение';
        } else if (optEl.value === 'audio') {
            optEl.textContent = 'Аудио';
        } else if (optEl.value === 'video') {
            optEl.textContent = 'Видео';
        } else {
            optEl.textContent = optionItem;
        };
        selectEl.appendChild(optEl);
    };
};

function updatePost(data) {

    const post = posts[findIndexById(data.id)];
    post.likes = data.likes;

    const updPostEl = postsEl.querySelector(`[data-post-id="${post.id}"]`);
    const buttonLike = updPostEl.querySelector(`[data-id='button-like']`);
    buttonLike.textContent = '❤ ' + post.likes;

};

function updatePostFromID(id) {

    fetch(`${baseURL}/post/${id}`).then(
        res => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }
            return res.json();
        }
    ).then(
        data => {
            const post = posts[findIndexById(data.id)];
            post.likes = data.likes;

            const postEl = postsEl.querySelector(`[data-post-id = ${post.id}]`);
            const buttonLike = postEl.querySelector(`[data-id = button-like]`);
            buttonLike.textContent = '❤ ' + post.likes;
        }
    ).catch(error => {
        console.log(error);
    });

};

function findIndexById(id) {
    return posts.findIndex(o => o.id === id);
};

function addNewPost(item) {
    posts.unshift(item);
    newPostsId = posts[0].id + 1;
    rebuildLists();
}

function addNewPostEl(item) {

    //создание карточки
    const postEl = addElement('div', 'card my-2 mr-sm-2', postsEl);

    let captionPost = '';

    if (item.typeContent === 'regular') {

        //cоздание обычного поста
        const textEl = addElement('h5', 'card-text ml-3', postEl);
        textEl.textContent = item.linkContent;

        captionPost = 'Пост с текстом';

    } else if (item.typeContent === 'image') {

        //создание поста с изображением
        const imgEl = addElement('img', 'card-img-top', postEl);
        imgEl.src = item.linkContent;

        captionPost = 'Пост с изображением';

    } else if (item.typeContent === 'audio') {

        //создание поста с аудио
        const audioScr = addElement('audio', 'card-img-top', postEl);
        audioScr.src = item.linkContent;
        audioScr.controls = true;

        captionPost = 'Пост с аудио';

    } else if (item.typeContent === 'video') {

        //создание поста с видео
        const videoScr = addElement('video', 'embed-responsive-item', postEl);
        videoScr.src = item.linkContent;
        videoScr.controls = true;

        captionPost = 'Пост с видео';

    } else {

        // пост со спамом
        const textEl = addElement('p', 'card-text', postEl);
        textEl.textContent = 'Спам';

        captionPost = 'Пост со спамом';

    };

    //область под контентом
    const postBodyEl = addElement('div', 'card-body', postEl);

    //подпись под контентом
    const postContentEl = addElement('p', 'card-text', postBodyEl);
    postContentEl.textContent = captionPost;

    //лайки
    const likesEl = addElement('button', 'btn btn-primary', postBodyEl);
    likesEl.textContent = '❤ ' + item.likes;
    likesEl.setAttribute('data-id', 'button-like');
    likesEl.onclick = function () {
        api.postJSON(`/posts/${item.id}/likes`, null, updatePost, sendError);
    };

    //дизлайки как уменьшение лайков
    const dislikesEl = addElement('button', 'btn btn-primary ml-2', postBodyEl);
    dislikesEl.textContent = '👎';
    dislikesEl.onclick = function () {
        api.deleteJSON(`/posts/${item.id}/likes`, null, updatePost, sendError);
    };

};

const sendError = error => {
    console.log(error);
};

function loadNewPosts() {

    fetch(`${baseURL}/get-new-posts/${newPostsId}`)
        .then(
            res => {
                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                return res.json();
            }

        ).then(
            data => {
                if (data === 'false') {
                    return;
                }

                addPosts(data);
                buttonLoadNewPosts.classList.toggle('button-invisibility');
                rebuildLists();
            }
        ).catch(error => {
            console.log(error);
        });
};

function setCheckNewPosts() {
    setInterval(() => {
        fetch(`${baseURL}/new-posts/${newPostsId}`)
            .then(
                res => {
                    if (!res.ok) {
                        throw new Error(res.statusText);
                    }
                    return res.text();
                }
            ).then(
                data => {

                    if (data === 'false') {
                        return;
                    }

                    buttonLoadNewPosts.classList.remove('button-invisibility');
                    buttonLoadNewPosts.textContent = `Загрузить новые посты (${data})`;

                }
            ).catch(error => {
                console.log(error);
            });
    }, 5000);
};

loadPosts();

