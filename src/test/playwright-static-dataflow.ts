import ts from 'typescript'

type StaticInvocationOptions = {
  sourceFile: ts.SourceFile
  unwrapExpression: (expression: ts.Expression) => ts.Expression
  resolvedDeclaration: (identifier: ts.Identifier) => ts.Node | undefined
  expressionPropertyName: (expression: ts.Expression) => string | undefined
  propertyNameText: (name: ts.PropertyName | undefined) => string | undefined
  constantStringExpression: (expression: ts.Expression) => string | undefined
}

const ASSIGNMENT_OPERATORS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
])
const INVOCATION_HELPERS = new Set(['apply', 'bind', 'call'])

export function createStaticInvocationAnalysis(options: StaticInvocationOptions) {
  const {
    sourceFile,
    unwrapExpression,
    resolvedDeclaration,
    expressionPropertyName,
    propertyNameText,
    constantStringExpression,
  } = options

  const resolvedAliasValue = (expression: ts.Expression, seen: Set<ts.Node>): ts.Expression => {
    const value = unwrapExpression(expression)
    if (!ts.isIdentifier(value)) return value
    const declaration = resolvedDeclaration(value)
    if (
      !declaration ||
      seen.has(declaration) ||
      !ts.isVariableDeclaration(declaration) ||
      !declaration.initializer
    ) {
      return value
    }
    seen.add(declaration)
    return unwrapExpression(declaration.initializer)
  }

  const isFunctionValuedExpression = (
    expression: ts.Expression,
    seen = new Set<ts.Node>()
  ): boolean => {
    const value = resolvedAliasValue(expression, seen)
    if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) return true
    if (ts.isIdentifier(value)) {
      return value !== unwrapExpression(expression) && isFunctionValuedExpression(value, seen)
    }
    if (!ts.isPropertyAccessExpression(value) && !ts.isElementAccessExpression(value)) return false

    const owner = resolvedAliasValue(value.expression, seen)
    if (
      ts.isElementAccessExpression(value) &&
      value.argumentExpression &&
      ts.isArrayLiteralExpression(owner) &&
      ts.isNumericLiteral(value.argumentExpression)
    ) {
      const element = owner.elements[Number(value.argumentExpression.text)]
      return Boolean(
        element && !ts.isOmittedExpression(element) && isFunctionValuedExpression(element, seen)
      )
    }
    if (!ts.isObjectLiteralExpression(owner)) return false
    const memberName = ts.isPropertyAccessExpression(value)
      ? value.name.text
      : value.argumentExpression
        ? constantStringExpression(value.argumentExpression)
        : undefined
    const property = owner.properties.find(
      candidate => propertyNameText(candidate.name) === memberName
    )
    if (property && ts.isMethodDeclaration(property)) return true
    const memberValue =
      property && ts.isPropertyAssignment(property)
        ? property.initializer
        : property && ts.isShorthandPropertyAssignment(property)
          ? property.name
          : undefined
    return Boolean(memberValue && isFunctionValuedExpression(memberValue, seen))
  }

  const declarationIsInvoked = (declaration: ts.Node): boolean => {
    let invoked = false
    const inspect = (candidate: ts.Node): void => {
      if (invoked) return
      const parent = candidate.parent
      if (
        ts.isIdentifier(candidate) &&
        resolvedDeclaration(candidate) === declaration &&
        ((ts.isCallExpression(parent) && parent.expression === candidate) ||
          (ts.isNewExpression(parent) && parent.expression === candidate) ||
          (ts.isTaggedTemplateExpression(parent) && parent.tag === candidate) ||
          ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
            parent.expression === candidate &&
            INVOCATION_HELPERS.has(expressionPropertyName(parent) ?? '')))
      ) {
        invoked = true
        return
      }
      ts.forEachChild(candidate, inspect)
    }
    inspect(sourceFile)
    return invoked
  }

  const assignedTargetIsInvoked = (target: ts.Expression): boolean => {
    const unwrapped = unwrapExpression(target)
    if (ts.isIdentifier(unwrapped)) {
      const declaration = resolvedDeclaration(unwrapped)
      return Boolean(declaration && declarationIsInvoked(declaration))
    }
    if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
      const targetText = unwrapped.getText(sourceFile)
      let invoked = false
      const inspect = (candidate: ts.Node): void => {
        if (invoked) return
        if (
          (ts.isCallExpression(candidate) || ts.isNewExpression(candidate)) &&
          candidate.expression.getText(sourceFile) === targetText
        ) {
          invoked = true
          return
        }
        ts.forEachChild(candidate, inspect)
      }
      inspect(sourceFile)
      return invoked
    }
    if (
      ts.isBinaryExpression(unwrapped) &&
      ASSIGNMENT_OPERATORS.has(unwrapped.operatorToken.kind)
    ) {
      return assignedTargetIsInvoked(unwrapped.left)
    }
    if (ts.isArrayLiteralExpression(unwrapped)) {
      return unwrapped.elements.some(
        element => !ts.isOmittedExpression(element) && assignedTargetIsInvoked(element)
      )
    }
    if (ts.isObjectLiteralExpression(unwrapped)) {
      return unwrapped.properties.some(property => {
        if (ts.isPropertyAssignment(property)) return assignedTargetIsInvoked(property.initializer)
        if (ts.isShorthandPropertyAssignment(property)) {
          const declaration = resolvedDeclaration(property.name)
          return Boolean(declaration && declarationIsInvoked(declaration))
        }
        if (ts.isSpreadAssignment(property)) return assignedTargetIsInvoked(property.expression)
        return false
      })
    }
    return false
  }

  const computedAccessIsInvoked = (access: ts.ElementAccessExpression): boolean => {
    let current: ts.Expression = access
    while (true) {
      if (
        ts.isParenthesizedExpression(current.parent) ||
        ts.isAsExpression(current.parent) ||
        ts.isTypeAssertionExpression(current.parent) ||
        ts.isNonNullExpression(current.parent) ||
        ts.isSatisfiesExpression(current.parent)
      ) {
        current = current.parent
        continue
      }
      if (
        ts.isBinaryExpression(current.parent) &&
        ASSIGNMENT_OPERATORS.has(current.parent.operatorToken.kind) &&
        current.parent.right === current
      ) {
        if (assignedTargetIsInvoked(current.parent.left)) return true
        current = current.parent
        continue
      }
      if (
        ts.isBinaryExpression(current.parent) &&
        ((current.parent.operatorToken.kind === ts.SyntaxKind.CommaToken &&
          current.parent.right === current) ||
          current.parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          current.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          current.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
      ) {
        current = current.parent
        continue
      }
      break
    }
    if (
      (ts.isCallExpression(current.parent) || ts.isNewExpression(current.parent)) &&
      current.parent.expression === current
    ) {
      return true
    }
    if (ts.isTaggedTemplateExpression(current.parent) && current.parent.tag === current) return true
    if (
      (ts.isPropertyAccessExpression(current.parent) ||
        ts.isElementAccessExpression(current.parent)) &&
      current.parent.expression === current &&
      INVOCATION_HELPERS.has(expressionPropertyName(current.parent) ?? '')
    ) {
      return true
    }
    return (
      ts.isVariableDeclaration(current.parent) &&
      current.parent.initializer === current &&
      ts.isIdentifier(current.parent.name) &&
      declarationIsInvoked(current.parent)
    )
  }

  return {
    assignedTargetIsInvoked,
    computedAccessIsInvoked,
    declarationIsInvoked,
    isFunctionValuedExpression,
  }
}
