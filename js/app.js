/* global console,$,document,window,alert */
var db;

// Utilitário de formatação de datas
function dtFormat(input) {
    if (!input) return "";
    var res = (input.getMonth() + 1) + "/" + input.getDate() + "/" + input.getFullYear() + " ";
    var hour = input.getHours();
    var ampm = "AM";
    if (hour === 12) ampm = "PM";
    if (hour > 12) {
        hour -= 12;
        ampm = "PM";
    }
    var minute = input.getMinutes() + 1;
    if (minute < 10) minute = "0" + minute;
    res += hour + ":" + minute + " " + ampm;
    return res;
}
/* Verificação de suporte ao recurso HTML5 IndexedDB e criação do banco de dados */
$(document).ready(function () {

    if (!("indexedDB" in window)) {
        alert("Seu navegador não suporta o recurso HTML5 IndexedDB");
        return;
    }

    var $noteDetail = $("#noteDetail");
    var $noteForm = $("#noteForm");

    var openRequest = window.indexedDB.open("bd_empregados", 1);

    openRequest.onerror = function (e) {
        console.log("Erro ao abrir o banco de dados");
        console.dir(e);
    };

    openRequest.onupgradeneeded = function (e) {

        var thisDb = e.target.result;
        var objectStore;

        //Criando o Object Store
        if (!thisDb.objectStoreNames.contains("note")) {
            console.log("Necessário criar o object store");
            objectStore = thisDb.createObjectStore("note", { keyPath: "id", autoIncrement: true });
        }

    };

    openRequest.onsuccess = function (e) {
        db = e.target.result;

        db.onerror = function (event) {
            // Manipulador de erros genérico para todos os erros direcionados a este banco de dados
            alert("Erro no Banco de Dados: " + event.target.errorCode);
            console.dir(event.target);
        };

        showEmp();

    };

    /* Exibir empregados cadastrados */
    function showEmp() {

        var transaction = db.transaction(["note"], "readonly");
        var content = "<table class='table table-bordered table-striped'><thead><tr><th>Matrícula</th><th>Nome do Empregado</th><th>Coordenação</th><th>Unidade</th><th>Atualizado em</th><th>&nbsp;</td></thead><tbody>";

        transaction.oncomplete = function (event) {
            $("#noteList").html(content);
        };

        var handleResult = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                content += "<tr data-key=\"" + cursor.key + "\"><td class=\"notematricula\">" + cursor.value.matricula + "</td>";
                content += "<td class=\"notenome\">" + cursor.value.nome + "</td>";
                content += "<td class=\"notecoordenacao\">" + cursor.value.coordenacao + "</td>";
                content += "<td class=\"noteunidade\">" + cursor.value.unidade + "</td>";
                content += "<td>" + dtFormat(cursor.value.updated) + "</td>";

                content += "<td><a class=\"btn btn-primary edit\">Editar</a> <a class=\"btn btn-danger delete\">Deletar</a></td>";
                content += "</tr>";
                cursor.continue();
            }
            else {
                content += "</tbody></table>";
            }
        };

        var objectStore = transaction.objectStore("note");

        objectStore.openCursor().onsuccess = handleResult;

    }
    /* Deletar empregado*/
    $("#noteList").on("click", "a.delete", function (e) {
        var thisId = $(this).parent().parent().data("key");

        var t = db.transaction(["note"], "readwrite");
        var request = t.objectStore("note").delete(thisId);
        t.oncomplete = function (event) {
            showEmp();
            $noteDetail.hide();
            $noteForm.hide();
        };
        return false;
    });

    /* Editar empregado*/
    $("#noteList").on("click", "a.edit", function (e) {
        var thisId = $(this).parent().parent().data("key");

        var request = db.transaction(["note"], "readwrite")
            .objectStore("note")
            .get(thisId);
        request.onsuccess = function (event) {
            var note = request.result;
            $("#key").val(note.id);
            $("#matricula").val(note.matricula);
            $("#nome").val(note.nome);
            $("#coordenacao").val(note.coordenacao);
            $("#unidade").val(note.unidade);
            $noteDetail.hide();
            $noteForm.show();
        };

        return false;
    });

    /* Limpar Formulário*/
    $("#cleanBtn").click(function () {
        var matricula = $("#matricula").val("");
        var nome = $("#nome").val("");
        var coordenacao = $("#coordenacao").val("");
        var unidade = $("#unidade").val("");

    });


    /* Exibir dados ao clicar no empregado*/
    $("#noteList").on("click", "td", function () {
        var thisId = $(this).parent().data("key");
        var transaction = db.transaction(["note"]);
        var objectStore = transaction.objectStore("note");
        var request = objectStore.get(thisId);

        request.onsuccess = function (event) {
            var note = request.result;
            $noteDetail.html("<h2>" + note.matricula + "</h2><p>" + note.nome + "</p><p>" + note.coordenacao + "</p><p>" + note.unidade + "</p>").show();
            $noteForm.hide();
        };
    });

    /* Cadastrar empregado*/
    $("#addButton").on("click", function (e) {
        $("#matricula").val("");
        $("#nome").val("");
        $("#coordenacao").val("");
        $("#unidade").val("");
        $("#key").val("");
        $noteDetail.hide();
        $noteForm.show();
    });

    $("#saveButton").on("click", function () {


        // Criação de variável para incrementar e contabilizar os erros ----------------
        var contErro = 0;

        // Declaração das variáveis dos inputs-------------------------
        var matricula = document.getElementById('matricula');
        var nome = document.getElementById('nome');
        var coordenacao = document.getElementById('coordenacao');
        var unidade = document.getElementById('unidade');

        // Declaração das variáveis do span de erro------------------------------
        var msg_matricula = document.querySelector('.msg-matricula');
        var msg_nome = document.querySelector('.msg-nome');
        var msg_coordenacao = document.querySelector('.msg-coordenacao');
        var msg_unidade = document.querySelector('.msg-unidade');


        // Validação do campo matricula ---------------------------------------------------
        if (matricula.value == "") {
            msg_matricula.innerHTML = "Favor informar matrícula";
            msg_matricula.style.display = 'inline-block';
            contErro += 1; //incrementa o erro
        } else {
            msg_matricula.style.display = 'none';
        }


        // Validação do campo nome ------------------------------------
        if (nome.value == "") {
            msg_nome.innerHTML = "Favor preencher o nome do empregado";
            msg_nome.style.display = 'inline-block';
            contErro += 1; //incrementa o erro
        } else {
            msg_nome.style.display = 'none';
        }

        // Validação do campo coordenacao ------------------------------------
        if (coordenacao.value == "") {
            msg_coordenacao.innerHTML = "Favor preencher a coordenação";
            msg_coordenacao.style.display = 'inline-block';
            contErro += 1; //incrementa o erro
        } else {
            msg_coordenacao.style.display = 'none';
        }


        // Validação do campo unidade ------------------------------------------
        if (unidade.value == "") {
            msg_unidade.innerHTML = "Favor preencher a unidade corretamente";
            msg_unidade.style.display = 'inline-block';
            contErro += 1; //incrementa o erro
        } else {
            msg_unidade.style.display = 'none';
        }


        // Verifica os erros incrementados ---------------------------
        if (contErro > 0) { // Se for maior que zero, não envia o formulário
            evt.preventDefault();
        }



        var matricula = $("#matricula").val();
        var nome = $("#nome").val();
        var coordenacao = $("#coordenacao").val();
        var unidade = $("#unidade").val();
        var key = $("#key").val();

        var t = db.transaction(["note"], "readwrite");

        if (key === "") {
            t.objectStore("note")
                .add({ matricula: matricula, nome: nome, coordenacao: coordenacao, unidade: unidade, updated: new Date() });
        } else {
            t.objectStore("note")
                .put({ matricula: matricula, nome: nome, coordenacao: coordenacao, unidade: unidade, updated: new Date(), id: Number(key) });
        }

        t.oncomplete = function (event) {
            $("#key").val("");
            $("#matricula").val("");
            $("#nome").val("");
            $("#coordenacao").val("");
            $("#unidade").val("");
            showEmp();
            $noteForm.hide();
        };

        return false;
    });

});







