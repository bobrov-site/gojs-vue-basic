<script setup>
import { onMounted, ref } from "vue";
import * as go from "gojs";
import "../assets//styles/style.css";

const props = defineProps({ nodeDataArray: [], linkDataArray: [] });
const emitter = defineEmits(["ExternalObjectsDropped", "SelectionMoved"]);
const diagram = ref(null);
const diagramModel = ref();
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

      // Добавляем новую ноду ответа
      model.addNodeData({
        key: nextKey,
        text: "Ответ на вопрос #" + data.questionNumber,
        color: "lightgreen",
        // Указываем номер вопроса, к которому относится этот ответ, для создания связи
        parent: data.key,
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
  // Определение шаблона для нод
  const questionTemplate = 
  new go.Node("Auto")
  .add(
    new go.Shape("RoundedRectangle", {
      fill: "transparent", 
      stroke: "orange", 
      strokeWidth: 2
    }),
    new go.Panel("Vertical", {width: 360})
      .add(
        new go.TextBlock({
          margin: new go.Margin(20, 0, 20, 0),
          font: "14px DM Sans sans-serif",
          editable: false, // Заголовок не редактируемый
          text: "textAlign: 'left'",
          textAlign: "left",
          width: 340,
          stroke: "#1F1D1D99",
        })
        .bind("text", "questionNumber", function (qn) {
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
          })
          .bind("text", "question")
        )
        .add(
          new go.Shape("LineH", {
            stroke: "gray", 
            strokeWidth: 2, 
            height: 0, 
            stretch: go.GraphObject.Horizontal, 
            margin: new go.Margin(0, 0, 12, 0)
          })
        )
      .add(
        go.GraphObject.build("Button" , {
          click: addAnswer,
          height: 44,
          width: 320
        })
        .add(
          new go.TextBlock({
            text: "Добавить ответ",
            stroke: "green"
          })
        )
      )
      .add(
      )
  )

  const templatesMap = new go.Map();

  templatesMap.add("question", questionTemplate);

  myDiagram.nodeTemplateMap = templatesMap;

  // Создание начальной ноды
  myDiagram.model = new go.GraphLinksModel([
    {
      key: "1",
      questionNumber: "1",
      question: "Является ли ваше произведение ПО?",
      category: "question",
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
