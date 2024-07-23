<script setup>
import { onMounted, ref } from "vue";
import * as go from "gojs";
import "../assets//styles/style.css";

const props = defineProps({ nodeDataArray: [], linkDataArray: [] });
const emitter = defineEmits(["ExternalObjectsDropped", "SelectionMoved"]);
const diagram = ref(null);
const diagramModel = ref();
const lisences = [
  {
    id: 0,
    text: "MI2",
    weight: 0,
  },
  {
    id: 1,
    text: "Apache2",
    weight: 0,
  },
  {
    id: 2,
    text: "Test333",
    weight: 1,
  },
  {
    id: 3,
    text: "Tesss",
    weight: null,
  },
];
// Функция для добавления ответа
const init = () => {
  const $ = go.GraphObject.make;
  const myDiagram = $(
    go.Diagram,
    diagram.value.id, // ID div элемента, куда будет помещена диаграмма
    {
      "undoManager.isEnabled": true, // включает поддержку отмены для пользователя
    }
  );
  const addAnswer = (e, obj) => {
    const node = obj.part; // Получаем ноду, к которой принадлежит кнопка
    if (node !== null) {
      const data = node.data;
      const model = myDiagram.model;
      model.startTransaction("add answer");

      // Создаем уникальный ключ для новой ноды ответа
      const nextKey = (model.nodeDataArray.length + 1).toString();
      const answerKey =
        model.nodeDataArray.filter((item) => item.parent === data.key).length +
        1;

      // Добавляем новую ноду ответа
      model.addNodeData({
        key: nextKey,
        title: `Ответ ${answerKey} на вопрос #${data.questionNumber}`,
        // Указываем номер вопроса, к которому относится этот ответ, для создания связи
        parent: data.key,
        category: "answer",
      });

      // Создаем уникальный ключ для линка
      const nextLinkKey = (model.linkDataArray.length + 1).toString();

      // Добавляем связь от вопроса к ответу
      model.addLinkData({
        key: nextLinkKey,
        from: data.key,
        to: nextKey,
      });

      model.commitTransaction("add answer");
    }
  };

  const addLicense = (e, obj) => {
    myDiagram.startTransaction("addLicense");
    console.log(myDiagram.selection);
    // https://gojs.net/latest/intro/dataBinding.html
  };

  const chooseLicense = (e, obj) => {};
  // Определение шаблона для нод
  const questionTemplate = new go.Node("Auto").add(
    new go.Shape("RoundedRectangle", {
      fill: "transparent",
      stroke: "orange",
      strokeWidth: 2,
    }),
    new go.Panel("Vertical", { width: 360 })
      .add(
        new go.TextBlock({
          margin: new go.Margin(20, 0, 20, 0),
          font: "14px DM Sans sans-serif",
          editable: false, // Заголовок не редактируемый
          text: "textAlign: 'left'",
          textAlign: "left",
          width: 340,
          stroke: "#1F1D1D99",
        }).bind("text", "questionNumber", function (qn) {
          return "Вопрос " + qn;
        })
      )
      .add(
        new go.TextBlock({
          margin: new go.Margin(0, 0, 12, 0),
          font: "18px DM Sans sans-serif",
          stroke: "#1F1D1D",
          editable: true,
          width: 340,
        }).bind("text", "question")
      )
      .add(
        new go.Shape("LineH", {
          stroke: "gray",
          strokeWidth: 2,
          height: 0,
          stretch: go.GraphObject.Horizontal,
          margin: new go.Margin(0, 0, 12, 0),
        })
      )
      .add(
        go.GraphObject.build("Button", {
          click: addAnswer,
          height: 44,
          width: 320,
        }).add(
          new go.TextBlock({
            text: "Добавить ответ",
            stroke: "green",
          })
        )
      )
  );

  const answerTemplate = new go.Node("Auto").add(
    new go.Shape("RoundedRectangle", {
      fill: "transparent",
      stroke: "blue",
      strokeWidth: 2,
    }),
    new go.Panel("Table", { width: 360 })
      .add(
        new go.TextBlock({
          margin: new go.Margin(20, 0, 20, 0),
          font: "14px DM Sans sans-serif",
          editable: false, // Заголовок не редактируемый
          textAlign: "left",
          width: 340,
          stroke: "#1F1D1D99",
          row: 0,
          column: 1,
        }).bind("text", "title", function (title) {
          return title;
        })
      )
      .add(
        new go.TextBlock({
          margin: new go.Margin(0, 0, 12, 0),
          font: "18px DM Sans sans-serif",
          stroke: "#1F1D1D",
          editable: true,
          width: 340,
          text: "Да",
          row: 1,
          column: 1,
        }).bind("text", "answer", function (answer) {
          return answer;
        })
      )
      .add(
        new go.Shape("LineH", {
          stroke: "gray",
          strokeWidth: 2,
          height: 0,
          stretch: go.GraphObject.Horizontal,
          margin: new go.Margin(0, 0, 12, 0),
          row: 2,
          column: 1,
        })
      )
      .add(
        new go.TextBlock({
          margin: new go.Margin(0, 240, 12, 0),
          font: "18px DM Sans sans-serif",
          stroke: "#1F1D1D",
          editable: true,
          text: "Лицензия",
          width: 100,
          row: 3,
          column: 1,
        })
      )
      .add(
        new go.TextBlock({
          margin: new go.Margin(0, 0, 12, 240),
          font: "18px DM Sans sans-serif",
          stroke: "#1F1D1D",
          editable: true,
          // width: 340,
          text: "Значение",
          row: 3,
          column: 1,
        })
      )
      .add(
        new go.Panel("Vertical", {
          row: 4,
          column: 1,
          itemTemplate: new go.Panel("Table", {margin: new go.Margin(0, 0, 10, 0)})
            .add(
              new go.GraphObject.build("Button", {
                click: chooseLicense,
                height: 50,
                width: 130,
                margin: new go.Margin(0, 190, 0, 0),
              })
              .add(
                new go.TextBlock().bind("text", "text", function (t) {
                  return `${t} ↓`;
                })
              ),
              new go.GraphObject.build("Button", {
                click: chooseLicense,
                height: 50,
                width: 100,
                margin: new go.Margin(0, 0, 0, 220),
              }).add(
                new go.TextBlock().bind("text", "weight", function (t) {
                  return `${t} ↓`;
                })
              )
            )
        }).bind("itemArray", "lisences")
      )
      .add(
        go.GraphObject.build("Button", {
          click: addLicense,
          height: 44,
          width: 320,
          row: 5,
          column: 1,
        }).add(
          new go.TextBlock({
            text: "Добавить лиценцию",
          })
        )
      )
  );

  const templatesMap = new go.Map();

  templatesMap.add("question", questionTemplate);
  templatesMap.add("answer", answerTemplate);

  myDiagram.nodeTemplateMap = templatesMap;

  // Создание начальной ноды
  myDiagram.model = new go.GraphLinksModel([
    {
      key: "1",
      questionNumber: "1",
      question: "Является ли ваше произведение ПО?",
      category: "question",
    },
    {
      key: "2",
      title: "Ответ 1 на вопрос #1",
      parent: "1",
      category: "answer",
      lisences: lisences,
    },
  ]);
  diagramModel.value = myDiagram.model;
};

onMounted(function () {
  init();
});
</script>

<template>
  <div ref="diagram" class="goDiagram" id="myDiagramDiv"></div>
</template>

<style scoped>
.goDiagram {
  width: 100vw;
  height: 100vh;
  border: solid black 1px;
}
</style>
