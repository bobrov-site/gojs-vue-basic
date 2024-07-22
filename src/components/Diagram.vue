<script setup>
import { onMounted, ref } from "vue";
import * as go from "gojs";
import '../assets//styles/style.css'

const props = defineProps({ nodeDataArray: Array, linkDataArray: Array });
const emitter = defineEmits(["ExternalObjectsDropped", "SelectionMoved"]);

const diagram = ref(null);
const $ = go.GraphObject.make;

// Функция для добавления ответа
const init = () => {
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
      // Здесь можно добавить код для сохранения изменений в вопросе
      // и создания новой ноды с ответом. Например:
      const model = myDiagram.model;
      model.startTransaction("add answer");
      const nextKey = (model.nodeDataArray.length + 1).toString();
      model.addNodeData({
        key: nextKey,
        text: "Ответ на вопрос #" + data.questionNumber,
        color: "lightgreen",
      });
      model.commitTransaction("add answer");
    }
  };

  // Определение шаблона для нод
  myDiagram.nodeTemplate = $(
  go.Node,
  "Auto",
  $(go.Shape, "RoundedRectangle", {
    fill: "transparent", // Прозрачный фон
    stroke: "orange", // Оранжевая обводка
    strokeWidth: 2, // Толщина линии обводкиб
  }),
  $(
    go.Panel,
    "Vertical",
    { width: 360 },
    // Заголовок с номером вопроса и словом "вопрос"
    $(
      go.TextBlock, 
      {
        margin: new go.Margin(20, 0, 12, 0),
        font: "14px DM Sans sans-serif",
        editable: false, // Заголовок не редактируемый
        text: "textAlign: 'left'",
        textAlign: "left",
        width: 340,
        stroke: '#1F1D1D99'
      },
      new go.Binding("text", "questionNumber", function(qn) {
        return "Вопрос " + qn; // Добавление слова "вопрос"
      }).makeTwoWay()
    ),
    // Текстовое поле вопроса
    $(
      go.TextBlock,
      {
        margin: new go.Margin(0, 0, 12, 0),
        font: "18px DM Sans sans-serif",
        stroke: "#1F1D1D",
        editable: true,
        width: 340,
      },
      new go.Binding("text", "question").makeTwoWay()
    ),
    // Серая линия после текстового поля
    $(go.Shape, "LineH", {
      stroke: "gray",
      strokeWidth: 2,
      height: 0,
      stretch: go.GraphObject.Horizontal,
      margin: new go.Margin(0, 0, 12, 0),
    }),
    // Кнопка для добавления ответа
    $(
      "Button",
      { click: addAnswer }, // Функция добавления ответа
      $(go.TextBlock, "Добавить ответ", { stroke: "green" }), // Зеленый цвет текста
      { background: "gray", margin: new go.Margin(0, 0, 12, 0), width: 340, height: 44 } // Серый фон кнопки
    )
  )
);

  // Создание начальной ноды
  myDiagram.model = new go.GraphLinksModel([
    {
      key: "1",
      questionNumber: "1",
      question: "Является ли ваше произведение ПО?",
    },
  ]);
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
