<script setup>
import { computed, onMounted, ref, shallowRef } from "vue";
import * as go from "gojs";
import "../assets//styles/style.css";
import api from "../api";

const green = "#00C16A";
const red = "#FCA5A5";
const sky = "#7DD3FC";
const gray = "#64748B";
const diagram = ref(null);
const nodes = ref({});
const startNode = {
  key: "1",
  questionNumber: "1",
  question: "Является ли ваше произведение ПО?",
  category: "question",
  loc: "0, 0",
};
const isDialogOpen = ref(false);
const diagramModel = shallowRef();
const currentNode = shallowRef(null);
const licenseListModal = ref([]);
const licenseList = ref([]);
const computedListLicenses = computed(() => {
  if (licenseListModal.value.length === 0) {
    return licenseList.value;
  } else {
    return licenseList.value
      .filter((l) => !licenseListModal.value.includes(l.name))
      .map((item) => item);
  }
});

const fetchLicenses = async () => {
  const licenses = await api.fetchLicenses();
  licenses.map((item) => {
    const license = {
      id: item.id,
      name: item.name,
      weight: 0,
    };
    return license;
  });
  licenseList.value = licenses;
};
const init = () => {
  const $ = go.GraphObject.make;
  const myDiagram = $(
    go.Diagram,
    diagram.value.id, // ID div элемента, куда будет помещена диаграмма
    {
      "undoManager.isEnabled": true, // включает поддержку отмены для пользователя,
    }
  );

  const addAnswer = (e, obj) => {
    const node = obj.part; // Получаем ноду, к которой принадлежит кнопка
    const defaultLocation = {
      x: node.location.x + 0,
      y: node.location.y + 200,
    };
    if (node !== null) {
      const data = node.data;
      const model = myDiagram.model;
      model.startTransaction("add answer");
      const nextKey = (model.nodeDataArray.length + 1).toString();
      const answerKey =
        model.nodeDataArray.filter((item) => item.parent === data.key).length +
        1;
      const parentQuestion = data.key;
      const keyOfParentQuestion = model.nodeDataArray.find(
        (item) => item.key === parentQuestion
      ).parent;
      const licenses = [];
      if (keyOfParentQuestion) {
        const parentData = model.nodeDataArray
          .find((item) => item.key === keyOfParentQuestion)
          .licenses.filter((item) => item.weight !== "null");
        licenses.push(...parentData);
      }
      const siblings = model.nodeDataArray.filter(
        (item) => item.parent === data.key
      );
      // Добавляем новую ноду в бок ответа
      if (siblings.length !== 0) {
        defaultLocation.x = siblings[siblings.length - 1].loc.x + 400;
      }
      model.addNodeData({
        key: nextKey,
        title: `Ответ ${answerKey} на вопрос #${data.questionNumber}`,
        // Указываем номер вопроса, к которому относится этот ответ, для создания связи
        parent: parentQuestion,
        category: "answer",
        loc: new go.Point(defaultLocation.x, defaultLocation.y),
        licenses: licenses,
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

  const addQuestion = (e, obj) => {
    const node = obj.part;
    const model = myDiagram.model;
    if (node !== null) {
      model.startTransaction("add question");
      const data = node.data;
      const nextKey = (model.nodeDataArray.length + 1).toString();
      const isHaveChildren = model.nodeDataArray.some((item) => item.parent === data.key && item.category === "question");
      if (isHaveChildren) {
        return;
      }
      const questionNumber =
        model.nodeDataArray.filter((item) => item.category === "question")
          .length + 1;
      // Добавляем новую ноду ответа
      model.addNodeData({
        key: nextKey,
        questionNumber: `${questionNumber}`,
        question: "Текст вопроса",
        parent: data.key,
        category: "question",
        loc: new go.Point(node.location.x + 0, node.location.y + 350),
      });
      const nextLinkKey = (model.linkDataArray.length + 1).toString();
      // Добавляем связь от вопроса к ответу
      model.addLinkData({
        key: nextLinkKey,
        from: data.key,
        to: nextKey,
      });
      model.commitTransaction("add question");
    }
  };

  const collectLicensesWithWeights = (key) => {
    const nodeDataArray = myDiagram.model.nodeDataArray;
    const licenses = [];

    const collect = (currentKey) => {
      const node = nodeDataArray.find((item) => item.key === currentKey);
      if (node) {
        if (node.licenses) {
          licenses.push(...node.licenses);
        }
        if (node.parent) {
          collect(node.parent);
        }
      }
    };

    collect(key);

    // Счетчик лицензий
    const licenseCounts = licenses.reduce((acc, license) => {
      if (!acc[license.name]) {
        acc[license.name] = 0;
      }
      acc[license.name] += parseInt(license.weight, 10);
      return acc;
    }, {});

    // Преобразуем в массив объектов
    const result = Object.keys(licenseCounts).map((name) => ({
      name,
      weight: licenseCounts[name],
    }));

    return result;
  };

  const addResult = (e, obj) => {
    const node = obj.part;
    const model = myDiagram.model;
    if (node !== null) {
      model.startTransaction("add result");
      const data = node.data;
      const parentKey = data.key;
      const nextKey = (model.nodeDataArray.length + 1).toString();
      const resultLicenses = collectLicensesWithWeights(parentKey).filter(
        (item) => !isNaN(item.weight)
      );
      model.addNodeData({
        key: nextKey,
        parent: data.key,
        category: "result",
        licenses: resultLicenses,
        loc: new go.Point(node.location.x + 0, node.location.y + 400),
      });
      const nextLinkKey = (model.linkDataArray.length + 1).toString();
      model.addLinkData({
        key: nextLinkKey,
        from: data.key,
        to: nextKey,
      });
      model.commitTransaction("add result");
    }
  };

  const addLicense = (e, obj) => {
    const node = obj.part;
    const data = node.data;
    const key = data.key;
    const model = myDiagram.model;
    const isHaveChildren = model.nodeDataArray.some(
      (item) => item.parent === key
    );
    console.log(isHaveChildren);
    if (isHaveChildren) {
      return;
    }
    isDialogOpen.value = true;
    currentNode.value = node;
  };

  const removeNode = (e, obj) => {
    const node = obj.part;
    const model = diagramModel.value;

    if (model) {
      model.startTransaction("remove node and descendants");

      // Рекурсивная функция для сбора узлов и ссылок
      const collectNodesAndLinks = (node, nodesToRemove, linksToRemove) => {
        if (!node) return;

        // Собираем все ссылки, исходящие из данного узла
        node.linksConnected.each((link) => {
          if (link && link.data) {
            linksToRemove.push(link.data);
          }
        });

        // Собираем всех потомков рекурсивно
        node.findTreeChildrenNodes().each((child) => {
          collectNodesAndLinks(child, nodesToRemove, linksToRemove);
        });

        // Добавляем сам узел в список для удаления
        if (node.data) {
          nodesToRemove.push(node.data);
        }
      };

      const nodesToRemove = [];
      const linksToRemove = [];

      // Собираем все узлы и ссылки для удаления
      collectNodesAndLinks(node, nodesToRemove, linksToRemove);

      // Удаляем все собранные ссылки
      linksToRemove.forEach((linkData) => {
        model.removeLinkData(linkData);
      });

      // Удаляем все собранные узлы
      nodesToRemove.forEach((nodeData) => {
        model.removeNodeData(nodeData);
      });

      model.commitTransaction("remove node and descendants");
    }
  };

  // Определение шаблона для нод
  const questionTemplate = new go.Node("Auto")
    .bind(new go.Binding("location", "loc").makeTwoWay())
    .add(
      new go.Shape("RoundedRectangle", {
        fill: "transparent",
        stroke: red,
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
          }).bind(new go.Binding("text", "question").makeTwoWay())
        )
        .add(
          new go.Shape("LineH", {
            stroke: "#E2E8F0",
            strokeWidth: 1,
            height: 0,
            width: 340,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(0, 0, 12, 0),
          })
        )
        .add(
          go.GraphObject.build("Button", {
            click: addAnswer,
            height: 44,
            width: 340,
            margin: new go.Margin(0, 0, 12, 0),
          }).add(
            new go.TextBlock({
              text: "Добавить ответ",
              font: "14px DM Sans, sans-serif",
              stroke: green,
            })
          )
        )
        .add(
          go.GraphObject.build("Button", {
            click: removeNode,
            height: 44,
            width: 340,
            margin: new go.Margin(0, 0, 12, 0),
          }).add(
            new go.TextBlock({
              text: "Удалить",
              font: "14px DM Sans, sans-serif",
              stroke: red,
            })
          )
        )
    );

  const answerTemplate = new go.Node("Auto")
    .bind(new go.Binding("location", "loc").makeTwoWay())
    .add(
      new go.Shape("RoundedRectangle", {
        fill: "transparent",
        stroke: sky,
        strokeWidth: 2,
      }),
      new go.Panel("Table", { width: 360 })
        .add(
          new go.TextBlock({
            margin: new go.Margin(20, 0, 20, 0),
            font: "14px DM Sans sans-serif",
            editable: false, // Заголовок не редактируемый
            textAlign: "left",
            width: 320,
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
            width: 320,
            text: "Текст ответа",
            row: 1,
            column: 1,
          }).bind(new go.Binding("text", "answer").makeTwoWay())
        )
        .add(
          new go.Shape("LineH", {
            stroke: "#E2E8F0",
            strokeWidth: 1,
            height: 0,
            width: 320,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(0, 0, 12, 0),
            row: 2,
            column: 1,
          })
        )
        .add(
          new go.TextBlock({
            margin: new go.Margin(0, 220, 12, 0),
            font: "14px DM Sans, sans-serif",
            stroke: gray,
            editable: false,
            text: "Лицензия",
            width: 100,
            row: 3,
            column: 1,
          })
        )
        .add(
          new go.TextBlock({
            margin: new go.Margin(0, 0, 12, 250),
            font: "14px DM Sans, sans-serif",
            stroke: gray,
            editable: false,
            text: "Значение",
            row: 3,
            column: 1,
          })
        )
        .add(
          new go.Panel("Vertical", {
            row: 4,
            column: 1,
            itemTemplate: new go.Panel("Table", {
              margin: new go.Margin(0, 0, 10, 0),
            }).add(
              new go.TextBlock({
                editable: false,
                width: 100,
                margin: new go.Margin(0, 210, 0, 0),
                column: 0,
              }).bind(new go.Binding("text", "name").makeTwoWay()),
              new go.TextBlock({ editable: true, column: 1 }).bind(
                new go.Binding("text", "weight").makeTwoWay()
              )
            ),
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
              text: "+ Добавить лицензию",
              font: "14px DM Sans, sans-serif",
            })
          )
        )
        .add(
          new go.Shape("LineH", {
            stroke: "#E2E8F0",
            strokeWidth: 1,
            height: 0,
            width: 340,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(12, 0, 12, 0),
            row: 6,
            column: 1,
          })
        )
        .add(
          go.GraphObject.build("Button", {
            click: addQuestion,
            height: 44,
            width: 320,
            row: 7,
            column: 1,
          }).add(
            new go.TextBlock({
              text: "Добавить вопрос",
              stroke: green,
              font: "14px DM Sans, sans-serif",
            })
          )
        )
        .add(
          go.GraphObject.build("Button", {
            click: addResult,
            height: 44,
            width: 320,
            row: 8,
            column: 1,
            margin: new go.Margin(12, 0, 12, 0),
          }).add(
            new go.TextBlock({
              text: "Результат",
              stroke: green,
              font: "14px DM Sans, sans-serif",
            })
          )
        )
        .add(
          go.GraphObject.build("Button", {
            click: removeNode,
            height: 44,
            width: 320,
            row: 8,
            column: 1,
            margin: new go.Margin(12, 0, 12, 0),
          }).add(
            new go.TextBlock({
              text: "Удалить",
              stroke: red,
              font: "14px DM Sans, sans-serif",
            })
          )
        )
    );

  const resultTemplate = new go.Node("Auto")
    .bind(new go.Binding("location", "loc").makeTwoWay())
    .add(
      new go.Shape("RoundedRectangle", {
        fill: "transparent",
        stroke: green,
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
            text: "Результат",
            row: 0,
            column: 1,
          })
        )
        .add(
          new go.TextBlock({
            margin: new go.Margin(0, 0, 12, 0),
            font: "18px DM Sans sans-serif",
            stroke: "#1F1D1D",
            editable: true,
            width: 340,
            text: "Текст результата",
            row: 1,
            column: 1,
          }).bind(new go.Binding("text", "result").makeTwoWay())
        )
        .add(
          new go.Shape("LineH", {
            stroke: "#E2E8F0",
            strokeWidth: 1,
            height: 0,
            width: 340,
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(0, 0, 12, 0),
            row: 2,
            column: 1,
          })
        )
        .add(
          new go.Panel("Vertical", {
            row: 3,
            column: 1,
            itemTemplate: new go.Panel("Table", {
              margin: new go.Margin(0, 0, 10, 0),
            }).add(
              new go.TextBlock({
                editable: false,
                margin: new go.Margin(0, 180, 0, 0),
              }).bind(new go.Binding("text", "name").makeTwoWay()),
              new go.TextBlock({ editable: false }).bind(
                new go.Binding("text", "weight").makeTwoWay()
              )
            ),
          }).bind("itemArray", "licenses")
        )
    );

  const templatesMap = new go.Map();

  templatesMap.add("question", questionTemplate);
  templatesMap.add("answer", answerTemplate);
  templatesMap.add("result", resultTemplate);

  myDiagram.nodeTemplateMap = templatesMap;

  // Создание начальной ноды
  console.log(nodes.value.nodeDataArray.length === 0);
  if (nodes.value.nodeDataArray.length === 0) {
    myDiagram.model = new go.GraphLinksModel([startNode]);
  } else {
    myDiagram.model = new go.GraphLinksModel(nodes.value);
  }
  diagramModel.value = myDiagram.model;
};

const setLicenseToNode = (license) => {
  const node = currentNode.value;
  const diagram = node.diagram;
  const startLicense = {
    id: license.id,
    name: license.name,
    weight: 0,
  };
  diagram.startTransaction("addLicenseList");
  const data = [...node.data.licenses, startLicense];
  diagram.model.setDataProperty(node.data, "licenses", data);
  console.log(data, "data setLicenseToNode");
  licenseListModal.value = data
    .map((item) => item.name)
    .filter((item) => item !== license.name);
  diagram.commitTransaction("addLicenseList");
  isDialogOpen.value = false;
};

const removeAllNodesAndLinks = () => {
  if (diagramModel.value !== null) {
    const model = diagramModel.value;
    model.startTransaction("remove all nodes and links");

    // Удаляем все ноды и линки
    model.nodeDataArray = [];
    model.linkDataArray = [];
    model.addNodeData(startNode);
    console.log(model);
    model.commitTransaction("remove all nodes and links");
  }
};

const toggleDialog = () => {
  isDialogOpen.value = !isDialogOpen.value;
};

const fetchNodes = async () => {
  const response = await api.fetchNodes();
  nodes.value = response;
  console.log(response, "response fetchNodes");
};

const saveJson = async () => {
  const json = diagramModel.value.toJson();
  console.log(json);
  await api.saveJson(json);
};

onMounted(async () => {
  await fetchLicenses();
  await fetchNodes();
  init();
});
</script>

<template>
  <div ref="diagram" class="goDiagram" id="myDiagramDiv"></div>
  <div v-show="isDialogOpen" class="dialog">
    <div class="dialog-content">
      <div>
        <button class="dialog-button" @click.stop="toggleDialog" type="button">
          X
        </button>
      </div>
      <div class="row">
        <ul class="list">
          <li
            class="list-item"
            v-for="item in computedListLicenses"
            :key="item.id"
          >
            <button
              class="button-list"
              @click="setLicenseToNode(item)"
              type="button"
            >
              {{ item.name }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <button @click="removeAllNodesAndLinks" class="button button-reset">
    Сбросить конструктор
  </button>
  <button @click="saveJson" class="button" type="button">
    Сохранить изменения
  </button>
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
.dialog-text {
  font-size: 14px;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  line-height: 20px;
}
.list {
  list-style-type: none;
  padding-left: 0;
  display: flex;
  flex-wrap: wrap;
}
.button-list {
  color: #00c16a;
  padding: 10px;
  font-size: 14px;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  line-height: 20px;
  background: #f7f7fa;
  border: none;
  cursor: pointer;
  width: 100%;
}

.list-item {
  margin-right: 15px;
  margin-bottom: 15px;
}

.list-item:last-child {
  margin-right: 0;
  margin-bottom: 0;
}

.button-list:hover {
  color: #00c16a;
  background: #e5e5ea;
}
.button {
  color: #00c16a;
  padding: 10px;
  font-size: 14px;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  line-height: 20px;
  position: absolute;
  right: 40px;
  bottom: 40px;
  background: #f7f7fa;
  border: none;
  cursor: pointer;
  z-index: 9999;
}
.button-reset {
  right: 220px;
}
.button:hover {
  color: #00c16a;
  background: #e5e5ea;
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
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-family: "DM Sans", sans-serif;
  font-weight: 500;
  line-height: 20px;
  color: #00c16a;
}
</style>
