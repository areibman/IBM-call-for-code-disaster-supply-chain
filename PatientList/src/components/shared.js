import styled from "styled-components";

export const ItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid grey;
  margin-bottom: 10px;
  padding: 10px;
`;

export const ItemLabel = styled.div`
  width: 100%;
  height: 45px;
`;

export const ItemButton = styled.button.attrs({
  type: "button"
})`
  width: 125px;
  height: 45px;
  padding: 8px;
  border-radius: 4px;
  background-color: rebeccapurple;
  color: white;
`;

export const Input = styled.input`
  width: 100%;
  margin: 5px 0px;
  padding: 12px 20px;
  display: inline-block;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
`;
