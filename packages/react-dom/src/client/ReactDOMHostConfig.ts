export const insertBefore = (parent: Node, stateNode: any, before: Node | null) => {
  parent.insertBefore(stateNode, before);
}

export const appendChild = (parent: Node, stateNode: any) => {
  parent.appendChild(stateNode)
}