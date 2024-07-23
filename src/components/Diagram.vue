<script setup>
import { computed, onMounted, ref } from "vue";
import * as go from "gojs";
import "../assets//styles/style.css";

const props = defineProps({ nodeDataArray: [], linkDataArray: [] });
const emitter = defineEmits(["ExternalObjectsDropped", "SelectionMoved"]);
const diagram = ref(null);
const isDialogOpen = ref(false);
const diagramModel = ref();
const licenseListModal = ref([]);
const licenseList = ref([
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
]);
const computedListLicenses = computed(() => {
  if (licenseListModal.value.length === 0) {
    return licenseList.value.map((item) => item.text);
  }
  else {
    console.log(licenseListModal.value)
    console.log(licenseList.value)
    return licenseList.value.filter((l) => !licenseListModal.value.includes(l.text)).map((item) => item.text)
  }
})
const lisencesNamesList = licenseList.value.map((item) => item.text);
const lisencesWeight = [0, 1, null];
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
        licenses: [],
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
    const node = obj.part;
    const diagram = node.diagram;
    const startLisence = {
      text: 'Вставьте имя лицензии',
      weight: 0,
    }
    diagram.startTransaction("addLicense");
    const data = [...node.data.licenses, startLisence];
    diagram.model.setDataProperty(node.data, "licenses", data);
    isDialogOpen.value = true;
    licenseListModal.value = data.map((item) => item.text).filter((item) => item !== 'Вставьте имя лицензии');
    diagram.commitTransaction("addLicense");
    // https://gojs.net/latest/intro/dataBinding.html
  };

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

  const answerTemplate = new go.Node("Auto", {
  }).add(
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
          editable: false,
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
          editable: false,
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
              new go.TextBlock({
                editable: true, 
                margin: new go.Margin(0,180,0,0)
              }).bind(new go.Binding("text", "text").makeTwoWay()),
              new go.TextBlock({editable: true}).bind(new go.Binding("text", "weight").makeTwoWay())
            )
        }).bind("itemArray", "licenses")
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
            text: "Добавить лицензию",
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
      licenses: [],
    },
  ]);
  diagramModel.value = myDiagram.model;
};

const toggleDialog = () => {
  isDialogOpen.value = !isDialogOpen.value
}

onMounted(function () {
  init();
});
</script>

<template>
  <div ref="diagram" class="goDiagram" id="myDiagramDiv"></div>
  <div v-show="isDialogOpen" class="dialog">
    <div class="dialog-content">
      <div>
        <button class="dialog-button" @click.stop="toggleDialog" type="button">X</button>
      </div>
      <div>
        Скопируйте название лицензии ниже и вставьте в текстовое поле. Список доступных лицензий:
      </div>
      <ul>
      <li v-for="item in computedListLicenses" :key="item.id">{{ item }}</li>
    </ul>
    </div>
  </div>
</template>

<style scoped>
.goDiagram {
  width: 100vw;
  height: 100vh;
  border: solid black 1px;
}
.dialog {
  position: absolute;
  z-index: 9999;
  width: 100%;
  height: 100%;
  top: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  margin: auto;
  max-width: 300px;
  width: 100%;
  background-color: white;
  padding: 12px;
}

.dialog-button {
  margin-left: auto;
  display: inline-block;
}
</style>
